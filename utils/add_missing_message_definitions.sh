#!/bin/bash

echo "It works if it ends with OK..."

if [[ ! -d ../node_modules ]]
then
	echo "Please type 'npm install' in the root of the repo before running this script."
	exit 1
fi

if [[ ! -f ./common.xml ]]
then
	echo "Please make sure that the file 'common.xml' exists in this directory before proceeding."
	exit 1
fi

mv ../node_modules/mavlink/src/mavlink/message_definitions/v1.0/common.xml ../node_modules/mavlink/src/mavlink/message_definitions/v1.0/common.xml.backup

cp ./common.xml ../node_modules/mavlink/src/mavlink/message_definitions/v1.0

echo "OK"
