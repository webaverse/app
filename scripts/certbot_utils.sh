#!/bin/bash
usage() {
	echo "Usage: $0 [ -d domains (may be used multiple times)] [ -c cloudflare (optional) [ -a apikey ] ] [ -h help ]" 1>&2
}

exit_abnormal() {
	usage
	exit 1
}

cloudflare=0

while getopts :d:ca:h opt; do
    case $opt in
       	d) domains+=("$OPTARG");;
		c) cloudflare=1;;
		a) apikey="${OPTARG}";;
		h | *) 	usage 
				exit 1 
				;;
    esac
done

if [ ${#domains[@]} -eq 0 ]; then
	echo "Error: At least one domain required"
	exit_abnormal
	exit 1
else 
	echo "Registering:"
	for domain in "${domains[@]}"; do
		echo "${domain}"
	done
fi

CMD=""

if [ $cloudflare -eq 1 ];
then
	if [ -z $apikey ];
	then
		echo "Error: If using cloudflare, apikey required"
		exit_abnormal
		exit 1
	else
		echo "Running cloudflare variant..."
		touch ./credential.ini

		echo "dns_cloudflare_api_token = "$apikey >> ./credential.ini

		sudo chmod 0600 ./credential.ini

		CMD+="sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials ./credential.ini "
		for domain in "${domains[@]}"; 
		do
			CMD+="-d ${domain} "
		done

		echo "Running: ${CMD}"

		eval ${CMD}

		sudo rm ./credential.ini
	fi
else
	echo "Running standard variant..."

	CMD+="sudo certbot certonly "
	for val in ${domains[@]}; do
		CMD+="-d ${val} "
	done

	echo "Running: ${CMD}"
	
	eval ${CMD}
fi


