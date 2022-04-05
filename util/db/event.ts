import AWS from "util/aws";
import { profile } from "util/db/profile";

export interface event {
  date: Date;
  Name: string;
  url: string;
  Attendees?: string[] | profile[];
}

export interface event_update_schema {
  eventDate: Date;
  cognito_id: string;
}

/**
 * Fetch events from dynamodb
 * @param ym Date object used to identify which year & month partition key to fetch events from
 * @param getAttendees bool to determine whether to return attendees information or empty array
 * @returns list of events in a given month
 */
const fetchEvents = async (
  ym: Date,
  getAttendees: boolean = false
): Promise<event[]> => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const table = "Events";
  const pk = ym.toISOString().substring(0, 7); // YYYY-MM // partition key

  console.log(pk);

  const params = {
    TableName: table,
    KeyConditionExpression: "#pk = :partitionkey",
    ExpressionAttributeNames: {
      "#pk": "YearMonth",
    },
    ExpressionAttributeValues: {
      ":partitionkey": pk,
    },
  };
  const events: event[] = [];

  try {
    const result = await docClient.query(params).promise();

    if (result.Items) {
      result.Items.forEach((item) => {
        events.push({
          date: new Date(item.YearMonth + "-" + item.DayTime + " CST"), // set correct timezone
          Name: item.EventName,
          url: item.url,
          Attendees: getAttendees ? item.Attendees?.values ?? [] : [], // if no attendees then nullish coalesce to empty array
        });
      });
    }
    else {
      events.push({
        date: new Date(),
        Name: "No Events Found",
        url: "na",
        Attendees: [],
      })
    }

  } catch (err) {
    console.log(err);
  }

  return events;
};

/**
 * Update an event with the id of user who has checked in
 * @param update update operation data
 * @returns updated event document
 */
const updateEventAttendance = async (
  update: event_update_schema
): Promise<event | null> => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const table = "Events";

  const params = {
    TableName: table,
    Key: {
      YearMonth: update.eventDate.toISOString().substring(0, 7), // partition key
      DayTime: update.eventDate.toISOString().substring(8, 10), // sort key
    },
    UpdateExpression: "ADD #key :value",
    ExpressionAttributeNames: {
      "#key": "Attendees",
    },
    ExpressionAttributeValues: {
      ":value": docClient.createSet([update.cognito_id]),
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const result = await docClient.update(params).promise();

    if (result.Attributes) {
      return {
        ...(result.Attributes as event),
        date: new Date(
          result.Attributes.YearMonth + "-" + result.Attributes.DayTime + " CST" // set correct timezone
        ),
        Name: result.Attributes.EventName,
      };
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

const createEvent = async (newEvent: event): Promise<void> => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const table = "Events";

  const params = {
    TableName: table,
    Item: {
      YearMonth: newEvent.date.toISOString().substring(0, 7), // partition key
      DayTime: newEvent.date.toISOString().substring(8, 10), // sort key
      EventName: newEvent.Name,
      url: newEvent.url,
    },
  };

  try {
    const result = await docClient.put(params).promise();
  } catch (err) {
    console.log(err);
  }
};

export { fetchEvents, updateEventAttendance, createEvent };
