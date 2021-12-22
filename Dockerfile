FROM node
ARG pm2_secret_key	
ENV LAST_UPDATED 20160605T165400
ENV PM2_PUBLIC_KEY wicmdcymxzyukdq
ENV PM2_SECRET_KEY=$pm2_secret_key
ENV HOSTNAME=0
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
	

# Expose API port to the outside
EXPOSE 443
	

	# Launch application
CMD ["pm2-runtime", "index.mjs", "--", "-p", "--secret", "$PM2_SECRET_KEY", "--public", "$PM2_PUBLIC_KEY", "--no-auto-exit", "--instances", "1", "--restart-delay", "60000"]