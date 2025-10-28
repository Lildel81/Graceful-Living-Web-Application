const { buildChakraFilter } = require('../chakraFilter');

describe('buildChakraFilter', () =>{
    test('empty query -> empty filter', () => {
        expect(buildChakraFilter({})).toEqual({});
    });

    test('q builds $or regex across fields', () => {
        const f = buildChakraFilter({ q: 'ava' });
        expect(Array.isArray(f.$or)).toBe(true);
        expect(String(f.$or[0].fullName)).toMatch(/\/ava\/i/);
    });   

    test('simple equals fields', () => {
        const f = buildChakraFilter({ ageBracket: '30-40', healthcareWorker: 'Yes' });
        expect(f.ageBracket).toBe('30-40');
        expect(f.healthcareWorker).toBe('Yes'); // change to isHealthcareWorker if schema does
    });

    test('$all for familiarWith and challenges (AND)', () => {
        expect(buildChakraFilter({ familiarWith: 'Sound Baths' }))
        .toEqual({ familiarWith: { $all: ['Sound Baths'] } });

        const f = buildChakraFilter({ familiarWith: ['A','B'], challenges: ['Physical','Mental'] });
        expect(f.familiarWith).toEqual({ $all: ['A','B'] });
        expect(f.challenges).toEqual({ $all: ['Physical','Mental'] });
    });

    test('$in for focusChakra and archetype (OR)', () => {
        const f = buildChakraFilter({ focusChakra: ['Heart','Throat'], archetype: 'Healer' });
        expect(f.focusChakra).toEqual({ $in: ['Heart','Throat'] });
        expect(f.archetype).toEqual({ $in: ['Healer'] });
    });

    test('date range sets end-of-day for "to"', () => {
        const f = buildChakraFilter({ from: '2025-10-01', to: '2025-10-27' });
        expect(f.createdAt.$gte).toBeInstanceOf(Date);
        expect(f.createdAt.$lte.getHours()).toBe(23);
        expect(f.createdAt.$lte.getMinutes()).toBe(59);
        expect(f.createdAt.$lte.getSeconds()).toBe(59);
        expect(f.createdAt.$lte.getMilliseconds()).toBe(999);
    });

    test('omits keys when arrays empty', () => {
        const f = buildChakraFilter({ familiarWith: [], challenges: [] });
        expect(f.familiarWith).toBeUndefined();
        expect(f.challenges).toBeUndefined();
    });

  
});


