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
  gender: Male/Female (add hair if female)
  mutations: []
  head: "",
  eyesMouth?: "",
  ears: "",
  hair: "",
  torso: "",
  arm: {
    left: "",
    right: ""
  },
  leg: {
    left: "",
    right: ""
  },
  bank: [] (Add default hair default eyes, hair and eyes are stored in bank since they are the only ones customizable)
}
```