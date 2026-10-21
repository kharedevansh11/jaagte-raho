import { assessCall, extracted } from './alertness.js';

const exec = (over: object) => ({ id: 'x', status: 'completed', ...over });
const chat =
  'assistant: Kahan pahunche?\nuser: Hosur ke paas hoon bhai\nassistant: Khana khaya?\nuser: haan dhaba pe khaya';

describe('assessCall', () => {
  it('is GREEN for an alert, chatty driver', () => {
    const r = assessCall(
      exec({
        transcript: chat,
        extracted_data: {
          sounded_sleepy: 'no',
          coherent: 'yes',
          location: 'Hosur',
        },
      }),
    );
    expect(r).toMatchObject({ level: 'GREEN', score: 100, location: 'Hosur' });
  });

  it('is RED when sleepy and incoherent', () => {
    const r = assessCall(
      exec({
        transcript: chat,
        extracted_data: { sounded_sleepy: true, coherent: false },
      }),
    );
    expect(r.level).toBe('RED');
    expect(r.reasons).toEqual(['sounded sleepy', 'replies did not make sense']);
  });

  it('is AMBER when only sleepy', () => {
    expect(
      assessCall(
        exec({ transcript: chat, extracted_data: { sounded_sleepy: 'yes' } }),
      ).level,
    ).toBe('AMBER');
  });

  it('is MISSED on no-answer or voicemail', () => {
    expect(assessCall(exec({ status: 'no-answer' })).level).toBe('MISSED');
    expect(assessCall(exec({ answered_by_voice_mail: true })).level).toBe(
      'MISSED',
    );
  });

  it('is RED when the driver picked up but never spoke', () => {
    expect(assessCall(exec({ transcript: 'assistant: Hello?' })).level).toBe(
      'RED',
    );
  });

  it('is AMBER when the driver went quiet but otherwise made sense', () => {
    const r = assessCall(
      exec({
        transcript: `${chat}\nassistant: Hello, क्या आप अभी भी लाइन पर हैं?`,
        extracted_data: { sounded_sleepy: 'no', coherent: 'yes' },
      }),
    );
    expect([r.level, r.reasons]).toEqual([
      'AMBER',
      ['went quiet during the call'],
    ]);
  });

  it('is RED for a real sleepy call: went silent and replies made no sense', () => {
    // Shape copied from a real Bolna execution (execution 28c917b9…).
    const r = assessCall(
      exec({
        transcript:
          'assistant: Namaste Devansh ji! Kaise hain aap?\nuser:  हां मैं बढ़िया हूं\nassistant: Kya aapke saath koi hai?\nuser: sir\nassistant: Aap abhi kahan tak pahunch gaye hain?\nassistant: The call will now disconnect. Goodbye!',
        telephony_data: { hangup_reason: 'inactivity_timeout' },
        extracted_data: {
          Alertness: {
            coherent: { objective: 'no', confidence: 0.7 },
            sounded_sleepy: { objective: 'no', confidence: 0.85 },
            check_question: { objective: 'skipped' },
          },
        },
      }),
    );
    expect(r.level).toBe('RED');
    expect(r.reasons).toContain('went quiet during the call');
  });

  it('does not blame the driver for our failures', () => {
    expect(assessCall(exec({ status: 'balance-low' })).level).toBeNull();
  });
});

describe('extracted', () => {
  it('finds nested, wrapped keys regardless of case and separators', () => {
    const data = {
      Safety: { 'Sounded Sleepy': { objective: 'yes', confidence: 0.9 } },
    };
    expect(extracted(data, 'sounded_sleepy')).toBe('yes');
  });
});
