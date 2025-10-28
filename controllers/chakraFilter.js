const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function buildChakraFilter(qs = {}) {
    const{
        q, 
        ageBracket,
        healthcareWorker,          
        workedWithPractitioner,    
        familiarWith,
        challenges,
        from,
        to,
        focusChakra,
        archetype
    } = qs; 

    const filter = {}; 

    if(q) {
        const rx = new RegExp(q, 'i'); 
        filter.$or = [
            { fullName: rx },
            { email: rx },
            { contactNumber: rx },
            { jobTitle: rx },   
        ];
    }

    if (ageBracket) filter.ageBracket = ageBracket;

    if (healthcareWorker) filter.healthcareWorker = healthcareWorker;

    const fam = toArr(familiarWith);
    if (fam.length) filter.familiarWith = { $all: fam };

    const ch = toArr(challenges);
    if (ch.length) filter.challenges = { $all: ch };

    const fc = toArr(focusChakra);
    if (fc.length) filter.focusChakra = { $in: fc };

    const arch = toArr(archetype);
    if (arch.length) filter.archetype = { $in: arch };

    if (from || to ){
        filter.createdAt = {}; 
        if (from) filter.createdAt.$gte = new Date(from); 
        if(to){
            const d = new Date(to); 
            d.setHours(23, 59, 59, 999); 
            filter.createdAt.$lte = d; 
        }
    }

    return filter; 
}

module.exports = { buildChakraFilter, toArr}; 