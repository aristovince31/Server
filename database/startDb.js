const { spawn } = require('child_process');
const dynamoDBLocalPath = '../DynamoDb/DynamoDBLocal.jar';

const port = 8000;

/*
Start the DynamoDBLocal server
*/
function start()
{
    const dynamoDBProcess = spawn(
        'java',
        ['-Djava.library.path=./DynamoDBLocal_lib', '-jar', dynamoDBLocalPath, '-sharedDb', '-port', port, '-dbPath', "E:/DynamoDb"],
        {
          stdio: 'inherit',
        }
      );
      dynamoDBProcess.on('error', (err) => {
        console.error('Error starting DynamoDBLocal:', err);
      });
      
      dynamoDBProcess.on('close', (code) => {
        console.log(`DynamoDBLocal process closed with code ${code}`);
      });
      
      process.on('SIGINT', () => {
        console.log('Received SIGINT, stopping DynamoDBLocal');
        dynamoDBProcess.kill();
        process.exit();
      });
      
      process.on('SIGTERM', () => {
        console.log('Received SIGTERM, stopping DynamoDBLocal');
        dynamoDBProcess.kill();
        process.exit();
      });
}

module.exports = {start};