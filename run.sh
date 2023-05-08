echo "Compiling typescript to javascript"

npm run build

echo "The build was completed"


echo "About to run the application in a min"

npx nodemon build/server.js

 sudo docker build -t refer-and-earn-cabio .