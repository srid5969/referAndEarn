echo "Compiling typescript to javascript"

tsc

echo "The build was completed"


echo "About to run the application in a min"

npx nodemon src/server.ts

