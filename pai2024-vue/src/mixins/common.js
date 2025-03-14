const getIntersection = (array1, array2) => {
    const lookupSet = new Set(array2)
    return array1.filter(element => lookupSet.has(element))
}

export default {
    methods: {
        checkIfInRole(session, roles) {
            let intersection = getIntersection(session.roles || [], roles || [])
            return intersection.length > 0
        }
    }
}