module.exports = {
  apps: [
    {
      name: 'rotki.com',
      script: './.output/server/index.mjs',
      args: 'start',
      exec_mode: 'cluster',
      instances: 'max',
    },
  ],
};
