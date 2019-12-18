rm index.zip
cd package
zip -X -r "../index.zip" *
cd ..
aws lambda update-function-code --function-name CreateThumbnailFromImage-dev --zip-file fileb://index.zip
