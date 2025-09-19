#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

wget --no-verbose --tries=1 --spider "http://127.0.0.1:${NITRO_PORT}/health"
