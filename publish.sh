rm index.zip
zip -r "index.zip" Package
aws lambda update-function-code --function-name CreateThumbnailFromImage --zip-file fileb://index.zip
