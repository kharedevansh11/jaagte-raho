import {
  checkInContext,
  pickQuestion,
  QUESTIONS,
  timeOfNight,
} from './conversation.js';

const call = (minAgo: number, over: object = {}) =>
  ({
    kind: 'CHECK_IN',
    createdAt: new Date(Date.now() - minAgo * 60_000),
    completedAt: new Date(),
    level: 'GREEN',
    location: null,
    question: null,
    ...over,
  }) as never;

describe('pickQuestion', () => {
  it('never repeats a question within the night', () => {
    const asked: string[] = [];
    for (let i = 0; i < QUESTIONS.length; i++) asked.push(pickQuestion(asked));
    expect(new Set(asked).size).toBe(QUESTIONS.length);
  });

  it('starts over once every question was asked', () => {
    expect(QUESTIONS).toContain(pickQuestion([...QUESTIONS]));
  });
});

describe('checkInContext', () => {
  const now = new Date();

  it('knows it is the first call of the night', () => {
    const ctx = checkInContext([], 23, now);
    expect(ctx.call_number).toBe('first');
    expect(ctx.last_call).toMatch(/first call/);
    expect(ctx.time_of_night).toBe('the middle of the night');
  });

  it('remembers how the last call went and where they were', () => {
    const ctx = checkInContext(
      [call(22, { level: 'AMBER', location: 'Karnal' }), call(45)],
      2,
      now,
    );
    expect(ctx.call_number).toBe('third');
    expect(ctx.last_call).toBe(
      '22 minutes ago they sounded a little tired, near Karnal',
    );
  });

  it('skips questions already asked tonight', () => {
    const asked = QUESTIONS.slice(1).map((q, i) =>
      call(20 * (i + 1), { question: q }),
    );
    expect(checkInContext(asked, 1, now).check_question).toBe(QUESTIONS[0]);
  });

  it('greets by the hour', () => {
    expect(timeOfNight(20)).toBe('late evening');
    expect(timeOfNight(5)).toMatch(/early morning/);
  });
});
