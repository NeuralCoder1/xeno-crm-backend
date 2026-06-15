import request from 'supertest';
import { app } from '../../src/app';

describe('AI endpoints', () => {
  it('recommend channel', async () => {
    const res = await request(app).post('/api/ai/recommend-channel').send({ campaignType: 'promotional', audienceSize: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.channel).toBeDefined();
  });

  it('copilot', async () => {
    const res = await request(app).post('/api/ai/copilot').send({ prompt: 'Create campaign for inactive customers' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.segment).toBeDefined();
  });
});
