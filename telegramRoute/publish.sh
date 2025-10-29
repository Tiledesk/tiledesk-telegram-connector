#npm version patch
version=`node -e 'console.log(require("./package.json").version)'`
version_server=`node -e 'console.log(require("./telegramRoute/package.json").version)'`
echo "version $version"

## Update package-lock.json
npm install

## Update voiceRoute/package-lock.json
cd ./telegramRoute
npm install

cd ..

git add .
git commit -m "version added: ### $version"
git push remote main

if [ "$version" != "" ]; then
    git tag -a "$version" -m "`git log -1 --format=%s`"
    echo "Created a new tag, $version"
    git push --tags
    cd ./telegramRoute
    npm publish --access public
fi

echo "***************************************************************************"
echo "  Deployed: @tiledesk/tiledesk-voice-twilio-connector:$version_server"
echo "       Tagged: tiledesk/tiledesk-telegram-connector:$version"
echo "***************************************************************************"

