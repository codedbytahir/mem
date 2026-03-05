import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, RESOURCE_NAMES } from './config';
import { Session } from '@/types/session';

export async function createSession(sessionId: string, email: string): Promise<void> {
  try {
    const ttl = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

    const command = new PutCommand({
      TableName: RESOURCE_NAMES.SESSIONS_TABLE,
      Item: {
        id: sessionId,
        email,
        status: 'started',
        createdAt: new Date().toISOString(),
        transcript: [],
        ttl,
      },
    });

    await docClient.send(command);
    console.log(`[DynamoDB] Created session: ${sessionId}`);
  } catch (error) {
    console.error(`[DynamoDB Error] Failed to create session ${sessionId}:`, error);
    throw error;
  }
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const command = new GetCommand({
    TableName: RESOURCE_NAMES.SESSIONS_TABLE,
    Key: { id: sessionId },
  });

  const { Item } = await docClient.send(command);
  return (Item as Session) || null;
}

export async function updateSessionTranscript(sessionId: string, transcript: string[]): Promise<void> {
  const command = new UpdateCommand({
    TableName: RESOURCE_NAMES.SESSIONS_TABLE,
    Key: { id: sessionId },
    UpdateExpression: 'SET transcript = :transcript',
    ExpressionAttributeValues: {
      ':transcript': transcript,
    },
  });

  await docClient.send(command);
}

export async function updateSessionStatus(
  sessionId: string,
  status: Session['status'],
  additionalFields: Partial<Session> = {}
): Promise<void> {
  let updateExpression = 'SET #status = :status';
  const expressionAttributeNames: Record<string, string> = { '#status': 'status' };
  const expressionAttributeValues: Record<string, any> = { ':status': status };

  Object.entries(additionalFields).forEach(([key, value]) => {
    updateExpression += `, ${key} = :${key}`;
    expressionAttributeValues[`:${key}`] = value;
  });

  const command = new UpdateCommand({
    TableName: RESOURCE_NAMES.SESSIONS_TABLE,
    Key: { id: sessionId },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  await docClient.send(command);
}
