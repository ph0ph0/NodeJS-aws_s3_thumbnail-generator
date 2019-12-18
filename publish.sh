rm index.zip
cd Package
zip –X –r ../index.zip *
cd ..
aws lambda update-function-code --function-name ConvertImageToThumbnail --zip-file fileb://index.zip