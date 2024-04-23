const {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: "local",
  endpoint: "http://localhost:8000",
});
const documentClient = DynamoDBDocumentClient.from(client);

/**
 * Create a table if it does not exist
 * @param {string} tableName name of the table
 * @param {object} tableParams parameters for the table
 * @returns {boolean} true if table is created, false if table already exists
 */
async function createTableIfNotExists(tableName, tableParams) {
  const command = new ListTablesCommand({});
  const response = await client.send(command);
  const responseTables = response.TableNames;
  if (!responseTables.some((x) => x === tableName)) {
    const command = new CreateTableCommand(tableParams);
    await client.send(command);
    return true;
  } else {
    return false;
  }
}

/**
 * Add an item to the table
 * @param {string} tableName name of the table
 * @param {object} item item to be added to the table
 * @returns {object} response from the database
 */
async function addItem(tableName, item) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  const response = await documentClient.send(command);
  return response;
}

/**
 * Get an item from the table
 * @param {string} tableName name of the table
 * @param {object} key key of the item to be fetched
 * @returns {object} item fetched from the database
 */
async function getItem(tableName, key) {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  const response = await documentClient.send(command);
  return response.Item;
}

/**
 * Update an item in the table
 * @param {string} tableName name of the table
 * @param {object} key key of the item to be updated
 * @param {object} updateAttributes attributes to be updated
 * @param {object} conditionExpression condition to be satisfied for the update
 * @returns {object} response from the database
 */
async function updateItem(
  tableName,
  key,
  updateAttributes,
  conditionExpression = undefined
) {
  let expressionAttributeValues = {};
  Object.entries(updateAttributes).forEach(([key, value]) => {expressionAttributeValues[`:${key}`] = value});
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    ConditionExpression: conditionExpression,
    UpdateExpression: "set " + Object.keys(updateAttributes).map(attribute => `${attribute} = :${attribute}`).join(", "),
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  });
  const response = await documentClient.send(command);
  return response;
}

/**
 * Scan items from the table
 * @param {string} tableName name of the table
 * @param {string} filterExpression filter expression for the scan
 * @param {object} expressionAttributeValues values for the filter expression
 * @param {string} projectExpression projection expression for the scan
 * @returns {object} items fetched from the database
 */
async function scanItems(tableName, filterExpression, expressionAttributeValues, projectExpression = undefined) {
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ProjectionExpression: projectExpression,
  });
  const response = await documentClient.send(command);
  return response.Items;
}

/**
 * Delete an item from the table
 * @param {string} tableName name of the table
 * @param {object} key key of the item to be deleted
 * @returns {object} response from the database
 */
async function deleteItem(tableName, key) {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });
  const response = await documentClient.send(command);
  return response;
}

/**
 * Query items from the table
 * @param {string} tableName name of the table
 * @param {string} KeyConditionExpression key condition expression for the query
 * @param {object} ExpressionAttributeValues values for the key condition expression
 * @param {string} projectExpression projection expression for the query
 * @param {string} filterExpression filter expression for the query
 * @returns {object} items fetched from the database
 */

async function queryItems(tableName, KeyConditionExpression, ExpressionAttributeValues, projectExpression, filterExpression = undefined) {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: KeyConditionExpression,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: ExpressionAttributeValues,
    ProjectionExpression: projectExpression,
  });
  const response = await documentClient.send(command);
  return response.Items;
}

module.exports = {
  createTableIfNotExists,
  addItem,
  getItem,
  updateItem,
  deleteItem,
  queryItems,
  scanItems,
};
