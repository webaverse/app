FROM node
ARG pm2_secret_key	
ENV LAST_UPDATED 20160605T165400
ENV PM2_PUBLIC_KEY wicmdcymxzyukdq
ENV PM2_SECRET_KEY=$pm2_secret_key
ENV HOSTNAME=0
ENV URL=https://local.webaverse.com
ENV PORT=443
LABEL description="webaverse-app"
	
# Copy source code
COPY . /app
	

# Change working directory
WORKDIR /app
	

# Install dependencies
RUN apt update -y
RUN npm install -g pm2
RUN npm install
#RUN date +%s%3N | export HOSTNAME=standin
#RUN pm2 link $PM2_SECRET_KEY $PM2_PUBLIC_KEY $HOSTNAME
RUN  apt-get install -y apt-transport-https \
		xvfb \
		libxcursor1 \
		libgtk-3-dev \
		libxss1 \
		libasound2 \
		libnspr4 \
		libnss3 \
		libx11-xcb1
	

# Expose API port to the outside
EXPOSE 443
EXPOSE 444
	

	# Launch application
CMD npm run start-pm2 && npm run setup:test && npm test