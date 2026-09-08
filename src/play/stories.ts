export const stories = {
  ocean: {
    name: 'Ocean',
    subtitle: 'Sail beyond the shore',
    description:
      'The playroom becomes a ship, with the wind in its sails. Bring your toys and watch the gulls and islands drift by.',
    worldName: 'Kaia’s sailing ship',
    thought: 'Wow! Our room is a ship now!',
    arrival: 'All aboard! Bring your toys and set sail with Kaia.',
    canvasLabel: 'Kaia playing on the deck of a ship sailing across the ocean',
    day: '#e4ede7',
    night: '#d2dfda',
    zoom: 0.86,
  },
  space: {
    name: 'Space',
    subtitle: 'Make friends with the stars',
    description:
      'Step into the space station and gaze across the Milky Way. Look for blue Earth, Saturn’s delicate rings, and a passing shooting star.',
    worldName: 'Kaia’s space station',
    thought: 'Look! Earth is a little blue ball!',
    arrival: 'Welcome to the space station. Come play among the stars with Kaia.',
    canvasLabel:
      'Kaia playing in a space station with panoramic windows, surrounded by the Milky Way, distant stars, blue Earth, and shooting stars',
    day: '#0b132c',
    night: '#080f24',
    zoom: 0.77,
  },
  zoo: {
    name: 'Zoo',
    subtitle: 'Meet furry friends',
    description:
      'A crocodile glides through its big pond while a cat and dog wander nearby. Bunnies hop across the grass and two parrots preen on their perch.',
    worldName: 'Kaia’s animal friends',
    thought: 'Giraffe, can you see the clouds?',
    arrival: 'The animals are here! Play on the grass and meet your new friends.',
    canvasLabel:
      'Kaia playing on the zoo lawn, with a swimming crocodile, a wandering cat and dog, hopping bunnies, preening parrots, and a giraffe, elephant, and lion nearby',
    day: '#eaf0df',
    night: '#dbe3cc',
    zoom: 0.82,
  },
  polar: {
    name: 'Polar',
    subtitle: 'Follow the northern lights',
    description:
      'Make camp beside an igloo. Penguins waddle, seals peek around, and ice floes gently bob as the northern lights drift across the sky.',
    worldName: 'Kaia’s aurora camp',
    thought: 'The penguins waddle and the sky dances!',
    arrival: 'Welcome to aurora camp! Watch the glowing sky with penguins and seals.',
    canvasLabel:
      'Kaia playing at an ice floe camp beside an igloo, surrounded by penguins, seals, icebergs, and gently moving northern lights',
    day: '#142e43',
    night: '#102437',
    zoom: 0.78,
  },
  forest: {
    name: 'Treehouse',
    subtitle: 'Fireflies after dark',
    description:
      'Spend the night in a cozy treehouse. A rope bridge leads to the next tree, a stream sparkles below, and squirrels and fireflies keep you company.',
    worldName: 'Kaia’s moonlit treehouse',
    thought: 'Shh! The fireflies brought tiny lanterns!',
    arrival: 'Welcome to the moonlit treehouse. The stream sparkles and the squirrels are waiting.',
    canvasLabel:
      'Kaia playing on a raised wooden treehouse platform in a nighttime forest, with a rope bridge, stream, warm lights, fireflies, and squirrels',
    day: '#142f34',
    night: '#10272e',
    zoom: 0.74,
  },
} as const;

export type StoryId = keyof typeof stories;
export const storyIds = Object.keys(stories) as StoryId[];
