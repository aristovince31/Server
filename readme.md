## User Schema:
 ### User Description
- id: String - Unique id for the user
- firstName: String - First name of the user
- lastName: String - Last name of the user
- email: String - Email of the user
- password: String - Password of the user
- loginType: String - Type of the user (Admin/User)

### JSON:
```JavaScript
{
    "id" : "21e8jp-weff908e-ffwefe-2312",
    "firstName": "Tom",
    "lastName": "Joe",
    "email": "Tom@gmail.com",
    "password": "Admin@1234",
    "loginType": "User"
    "CreatedAt" : epoch time,
}
```


```Javascript
{
  TableName: "Users",
  KeySchema: [
    {
      AttributeName: "email",
      KeyType: "HASH",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "email",
      AttributeType: "S",
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
- eventId: String - Unique id for the event
- eventName: String - Name of the event
- ownerId: String - Unique id for the owner
- slotDuration: String - Duration of the slot
- startDate: Number - Start date of the event
- endDate: Number - End date of the event
- selectWeek: Object - Object containing the days of the week and their respective start and end time
- createdAt: Number - Created date of the event
- updatedAt: Number - Updated date of the event


```Javascript
{
    "eventId": "1hnscl6aa082644f5c53bc1",
    "ownerId": "1hnhv3c1s020fe97a9b4252,
    "eventName": "Yoga123",
    "slotDuration": "02:00",
    "startDate": epoch time,
    "endDate": epoch time,
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
    },
    {
      AttributeName: "ownerId",
      KeyType: "RANGE",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
    {
      AttributeName: "ownerId",
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
- appointmentId: String - Unique id for the appointment
- appointmentDate: Number - Date of the appointment
- personName: String - Name of the person
- personPhone: String - Phone number of the person
- timeSlot: String - Time slot of the appointment
- eventName : String - Name of the event

```Javascript
{
    "eventId": "1hni229ar08ce200ajhtg",
    "userId": "1hnhv3c1s020fe97a9b4252",
    "appointmentId": "1hni229ar08ce200ajhtg",
    "eventName": "Yoga123",
    "appointmentDate": epoch time,
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
      AttributeName: "appointmentDate",
      KeyType: "HASH",
    },
    {
      AttributeName: "appointmentId",
      KeyType: "RANGE",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "appointmentDate",
      AttributeType: "N",
    },
    {
      AttributeName: "appointmentId",
      AttributeType: "S",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
}
```