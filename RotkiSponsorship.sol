// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RotkiSponsorship is ERC721, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant ETH_ADDRESS = address(0);

    struct Tier {
        uint256 maxSupply; // 0 for unlimited
        uint256 currentSupply;
        string metadataURI; // IPFS URI for this tier's metadata
    }

    address public treasuryAddress;
    uint256 public treasuryGasLimit; // Gas limit for treasury transfers
    uint256 public currentReleaseId;
    uint256 public tokenIdCounter;

    // releaseId => tierId (0=Bronze, 1=Silver, 2=Gold) => Tier data
    mapping(uint256 => mapping(uint256 => Tier)) public tiers;

    // tierId => paymentToken => price in that currency (current prices only)
    // Use ETH_ADDRESS (address(0)) for ETH payments
    mapping(uint256 => mapping(address => uint256)) public currentPrices;

    // tokenId => releaseId
    mapping(uint256 => uint256) public tokenReleaseId;

    // tokenId => tierId
    mapping(uint256 => uint256) public tokenTierId;

    // Payment tokens enabled status
    // address => enabled (true/false)
    // ETH_ADDRESS (address(0)) is always enabled
    mapping(address => bool) public paymentTokensEnabled;

    event ReleaseStarted(uint256 indexed releaseId);
    event PaymentTokenEnabled(address indexed tokenAddress);
    event PaymentTokenDisabled(address indexed tokenAddress);
    event PriceSet(uint256 indexed tierId, address indexed paymentToken, uint256 price);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event TreasuryGasLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event TreasuryPushFailed(address indexed from, uint256 amount, uint256 gasLimit, uint256 timestamp);
    event NFTMinted(uint256 indexed tokenId, uint256 indexed releaseId, uint256 indexed tierId, address minter);
    event TierMetadataUpdated(
        uint256 indexed releaseId,
        uint256 indexed tierId,
        string oldURI,
        string newURI,
        uint256 timestamp
    );

    constructor(address _treasuryAddress, address _owner) ERC721("Rotki Release Sponsorship", "RSPNSR") Ownable(_owner) {
        require(_treasuryAddress != address(0), "Invalid treasury address");
        treasuryAddress = _treasuryAddress;
        treasuryGasLimit = 100000; // Default generous gas limit

        // ETH is enabled from the start
        paymentTokensEnabled[ETH_ADDRESS] = true;
    }

    function mint(uint256 _tierId, address _paymentToken)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        // CHECKS: Validate all inputs
        require(currentReleaseId > 0, "No active release");
        require(_tierId < 3, "Invalid tier");
        require(paymentTokensEnabled[_paymentToken], "Payment token not enabled");

        Tier storage tier = tiers[currentReleaseId][_tierId];

        uint256 price = currentPrices[_tierId][_paymentToken];
        require(price > 0, "Price not set for this token");

        if (_paymentToken == ETH_ADDRESS) {
            // ETH payment
            require(msg.value == price, "Incorrect ETH amount");
        } else {
            // ERC20 payment
            require(msg.value == 0, "ETH sent for token payment");
        }

        // EFFECTS: Update state before external interactions
        // Atomic increment and check to prevent overselling under concurrency
        uint256 newSupply = tier.currentSupply + 1;
        require(tier.maxSupply == 0 || newSupply <= tier.maxSupply, "Tier sold out");
        tier.currentSupply = newSupply;

        uint256 tokenId = tokenIdCounter++;
        tokenReleaseId[tokenId] = currentReleaseId;
        tokenTierId[tokenId] = _tierId;

        // INTERACTIONS: External calls and minting
        if (_paymentToken == ETH_ADDRESS) {
            // ETH payment with gas limit and non-reverting push
            (bool success, ) = treasuryAddress.call{value: msg.value, gas: treasuryGasLimit}("");
            if (!success) {
                emit TreasuryPushFailed(msg.sender, msg.value, treasuryGasLimit, block.timestamp);
                // funds stay in contract for later withdrawal
            }
        } else {
            // ERC20 payment
            IERC20(_paymentToken).safeTransferFrom(msg.sender, treasuryAddress, price);
        }

        _safeMint(msg.sender, tokenId);
        emit NFTMinted(tokenId, currentReleaseId, _tierId, msg.sender);
    }

    function startNewRelease(Tier[] memory _tiers) external onlyOwner {
        require(_tiers.length == 3, "Must provide exactly 3 tiers");

        currentReleaseId++;

        for (uint256 i = 0; i < 3; i++) {
            require(bytes(_tiers[i].metadataURI).length > 0, "Tier metadataURI empty");
            tiers[currentReleaseId][i] = Tier({
                maxSupply: _tiers[i].maxSupply,
                currentSupply: 0, // Always start with 0
                metadataURI: _tiers[i].metadataURI
            });
        }

        emit ReleaseStarted(currentReleaseId);
    }

    function enablePaymentToken(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != ETH_ADDRESS, "ETH is always enabled");
        require(!paymentTokensEnabled[_tokenAddress], "Token already enabled");

        paymentTokensEnabled[_tokenAddress] = true;
        emit PaymentTokenEnabled(_tokenAddress);
    }

    function disablePaymentToken(address _tokenAddress) external onlyOwner {
        require(paymentTokensEnabled[_tokenAddress], "Token not enabled");

        paymentTokensEnabled[_tokenAddress] = false;
        emit PaymentTokenDisabled(_tokenAddress);
    }

    function setTierPrice(
        uint256 _tierId,
        address _paymentToken,
        uint256 _price
    ) external onlyOwner {
        require(_tierId < 3, "Invalid tier");
        require(_price > 0, "Price must be greater than 0");
        require(paymentTokensEnabled[_paymentToken], "Payment token not enabled");

        currentPrices[_tierId][_paymentToken] = _price;
        emit PriceSet(_tierId, _paymentToken, _price);
    }

    function setTreasuryAddress(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasuryAddress;
        treasuryAddress = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    function updateTreasuryGasLimit(uint256 _gasLimit) external onlyOwner {
        require(_gasLimit > 0, "Gas limit must be greater than 0");
        uint256 oldLimit = treasuryGasLimit;
        treasuryGasLimit = _gasLimit;
        emit TreasuryGasLimitUpdated(oldLimit, _gasLimit);
    }

    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool success, ) = treasuryAddress.call{value: balance}("");
        require(success, "ETH withdrawal failed");
    }

    function rescueERC20(address _token, uint256 _amount) external onlyOwner nonReentrant {
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    // Allow contract to receive ETH for emergency recovery
    receive() external payable {}

    function updateTierMetadata(uint256 _releaseId, uint256 _tierId, string memory _newMetadataURI) external onlyOwner {
        require(_releaseId > 0 && _releaseId <= currentReleaseId, "Invalid release ID");
        require(_tierId < 3, "Invalid tier");
        require(bytes(_newMetadataURI).length > 0, "Empty metadata URI");

        Tier storage tier = tiers[_releaseId][_tierId];
        string memory oldURI = tier.metadataURI;
        tier.metadataURI = _newMetadataURI;

        emit TierMetadataUpdated(_releaseId, _tierId, oldURI, _newMetadataURI, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        _requireOwned(_tokenId);

        uint256 releaseId = tokenReleaseId[_tokenId];
        uint256 tierId = tokenTierId[_tokenId];

        return tiers[releaseId][tierId].metadataURI;
    }

    function getTierInfo(uint256 _releaseId, uint256 _tierId)
        external
        view
        returns (uint256 maxSupply, uint256 currentSupply, string memory metadataURI)
    {
        Tier storage tier = tiers[_releaseId][_tierId];
        return (tier.maxSupply, tier.currentSupply, tier.metadataURI);
    }

    function getPrice(uint256 _tierId, address _paymentToken)
        external
        view
        returns (uint256)
    {
        return currentPrices[_tierId][_paymentToken];
    }
}
