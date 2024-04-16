## User Schema:
 ### User Description
- id: String - Unique id for the user
- firstName: String - First name of the user
- lastName: String - Last name of the user
- email: String - Email of the user
- password: String - Password of the user
- confirmPassword: String - Confirm password of the user
- loginType: String - Type of the user (Admin/User)

### JSON:
```JavaScript
{
    "id" : "weeweferfre23423r234",
    "firstName": "Tom",
    "lastName": "Joe",
    "email": "Tom@gmail.com",
    "password": "Admin@1234",
    "loginType": "User"
    "CreatedAt" : epoch time,
}
```

## User Table Schema:

### User Table Description
- TableName: Users
- KeySchema: Partition key is id
- AttributeDefinitions: Type of the partition key and GSI key
- GlobalSecondaryIndexes: 
  - IndexName - Email-index
  - KeySchema - email (HASH)
  - Projection - ALL

```Javascript
{
  TableName: "Users",
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
    {
      AttributeName: "email",
      AttributeType: "S",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "email-index",
      KeySchema: [
        {
          AttributeName: "email",
          KeyType: "HASH",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
}

```

## Event Schema

### Event Description
- id: String - Unique id for the event
- eventName: String - Name of the event
- slotDuration: String - Duration of the slot
- startDate: String - Start date of the event
- endDate: String - End date of the event
- selectWeek: Object - Object containing the days of the week and their respective start and end time


```Javascript
{
    "id": "1hnscl6aa082644f5c53bc1",
    "ownerId" : "",
    "eventName": "Yoga123",
    "slotDuration": "02:00",
    "startDate": "2024-02-26"
    "endDate": "2024-03-01",
    "selectWeek": {
        "mon": {
            "startTime": "10:00",
            "endTime": "16:00",
            "breakStart": "14:00",
            "breakEnd": "15:00"
        },
        "tue": {
            "startTime": "10:00",
            "endTime": "16:00",
            "breakStart": "14:00",
            "breakEnd": "16:00"
        },
        "wed": {
            "startTime": "10:00",
            "endTime": "16:00",
            "breakStart": "14:00",
            "breakEnd": "15:00"
        }
    },
    "CreatedAt" : epoch time,
    "UpdatedAt" : epoch time
}
```

## Event Table Schema

### Event Table Description
- TableName: Events
- KeySchema: Partition key is id
- AttributeDefinitions: Type of the partition key id

```Javascript
{
  TableName: "Events",
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH",
    }
  ],
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
}
```
## Appointment Schema

### Appointment Description

- eventId: String - Unique id for the event
- userId: String - Unique id for the user
- appointmentDate: String - Date of the appointment
- personName: String - Name of the person
- personPhone: String - Phone number of the person
- timeSlot: String - Time slot of the appointment

```Javascript
{
    "eventId": "1hni229ar08ce200ajhtg",
    "userId": "1hnhv3c1s020fe97a9b4252",
    "appointmentDate": "2024-02-26",
    "personName": "Hello",
    "personPhone": "1234567890",
    "timeSlot": "13:0-14:0"
}
```

## Appointment Table Schema

### Appointment Table Description

- TableName: Appointments
- KeySchema: Partition key is id
- AttributeDefinitions: Type of the partition key and GSI key
- GlobalSecondaryIndexes: 
  - IndexName - userId-index
  - KeySchema - userId (HASH) and appointmentDate (RANGE)
  - Projection - ALL


```Javascript
{
  TableName: "Appointments",
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
    {
      AttributeName: "userId",
      AttributeType: "S",
    },
    {
      AttributeName: "appointmentDate",
      AttributeType: "S",
    }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "userId-index",
      KeySchema: [
        {
          AttributeName: "userId",
          KeyType: "HASH",
        },
        {
          AttributeName: "appointmentDate",
          KeyType: "RANGE",
        }
      ],
      Projection: {
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
}
```