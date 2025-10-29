#npm version patch
version=`node -e 'console.log(require("./package.json").version)'`
echo "version $version"

## Update package-lock.json
npm install

cd ..

git add .
git commit -m "version added: ### $version"
git push remote main

if [ "$version" != "" ]; then
    git tag -a "$version" -m "`git log -1 --format=%s`"
    echo "Created a new tag, $version"
    git push --tags
    npm publish --access public
fi

echo "***************************************************************************"
echo "       Tagged: tiledesk/tiledesk-telegram-connector:$version"
echo "***************************************************************************"

