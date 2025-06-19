
export { Dict }

class Dict<Key extends string, Value> {

    private map: Object = {}

    constructor() {}

    add(key: Key, value: Value) {
        if (this.map.hasOwnProperty(key))
            throw Error(`Key ${String(key)} already in dictionary`);
        (this.map as Record<Key, Value>)[key] = value
    }

    set(key: Key, value: Value) {
        (this.map as Record<Key, Value>)[key] = value
    }

    has(key: Key): boolean {
        return this.map.hasOwnProperty(key)
    }

    get(key: Key): Value {
        if (!this.map.hasOwnProperty(key))
            throw Error(`Key ${String(key)} not in dictionary`)
        return (this.map as Record<Key, Value>)[key]
    }

}