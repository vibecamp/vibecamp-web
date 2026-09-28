#!/usr/bin/env python3
import json, sys

snap = json.load(open(sys.argv[1]))
for key in ('id', 'prevId'):
    snap.pop(key, None)
for table in snap.get('tables', {}).values():
    # Introspection returns unordered constraint columns; index ordering remains significant.
    for kind in ('uniqueConstraints', 'compositePrimaryKeys'):
        for constraint in table.get(kind, {}).values():
            constraint['columns'] = sorted(constraint['columns'])
json.dump(snap, sys.stdout, indent=1, sort_keys=True)
print()
