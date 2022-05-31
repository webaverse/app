#!/bin/bash

#give permission for everything in the webaverse-app directory
sudo chmod -R 777 /opt/webaverse-app

#navigate into our working directory where we have all our github files
cd /opt/webaverse-app


#install node modules
npm install

#start our node app in the background using PM2
#pm2 --name webaverse-app start "npm run dev"
pm2 restart all