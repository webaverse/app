# zjs

API-compatible [yjs](https://github.com/yjs/yjs) CRDT, but faster for game engine usage.

## Benefits

- Small memory footprint (O(data) objects garbage)
- Fast conflict resolution based on single clock, resolution priority, and binary history buffer
- Supports all JSON and binary data (typed arrays)

## Restrictions

- Only SFU supported
- Can only push one element at a time
- Cannot move elements
