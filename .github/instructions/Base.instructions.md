---
applyTo: '**'
---

# General Guidelines

Follow this firebase heirarchy for organizing your project files:

student documents should contain the following fields:
```
curriculum:"",
id:"",
lastPlayedAt: Timestamp,
name: {
  first: "",
  middle: "",
  last: ""
},
playTimeMinutes: Number,
mutations: {
  cured: 0
  failed: 0
},
section:"",
genemeter: 0-3
mutations: {
  cured: 0
  occurred: 0
},
stable: Date (like shield, the timestamp where mutations won't occur)
character: { (the code for each body part is defined in data/defaults.json)
  Gender: Male/Female (add hair if female)
Mutation: []
  Head: {
    Type: HE00
    EyesMouth?: EM00
    Ears: E00
    Hair?: H00
  },
  Torso: T00,
  Arm: {
    Left: AL00
    Right: AR00
  },
  Leg: {
    Left: LL00
    Right: LR00
  },
  Bank: [] (Add default hair default eyes, hair and eyes are stored in bank since they are the only ones customizable)
}
```