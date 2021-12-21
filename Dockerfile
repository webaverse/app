FROM node	
ENV LAST_UPDATED 20160605T165400	
LABEL description="webaverse-app"
	
# Copy source code
COPY . /app
	

# Change working directory
WORKDIR /app
	

# Install dependencies
RUN apt update -y
RUN npm install -g pm2
RUN pm2 link 0ve2nlmollwq16k wicmdcymxzyukdq
RUN npm install
RUN npm list
	

# Expose API port to the outside
EXPOSE 443
	

	# Launch application
# CMD forever -a -l /host/forever.log -o stdout.log -e stderr.log index.mjs -p
CMD pm2 start index.mjs -p
