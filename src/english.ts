/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2 (Primary 2) Hong Kong ENGLISH — 6 zones x 5 levels.
 * Grounded in the local P2 textbooks (Book 1 + Book 2) and the EDB
 * English KS1 (Lower Primary) scope:
 *  - Phonics: initial blends (cl, pl, sp, st, dr, tr), end sounds
 *    (-st, -nk, -nt, -tch), magic-e (a_e, o_e, i_e, u_e), long vowels.
 *  - Vocabulary: school & places, family & jobs, food & feelings,
 *    weather/seasons/clothing, daily activities & housework.
 *  - Grammar: a/an, plurals, be (is/are/am), has/have & do/does,
 *    this/that/these/those.
 *  - Prepositions of place & time + question words (where/what/how/which/why).
 *  - Sentences: and/or, because, like + -ing, word order, capitals & punctuation.
 *  - Reading comprehension (passages with Chinese glosses in the review only).
 *
 * Every item is multiple-choice with exactly ONE unambiguous answer.
 */
import type { Question } from './questions';

export interface LevelMeta { title: string; desc: string; }

export const ENGLISH_SECTION_LEVELS: Record<string, LevelMeta[]> = {
  eng_phonics: [
    { title: 'Beginning Blends', desc: 'cl · pl · sp · st · dr · tr。' },
    { title: 'Ending Sounds', desc: '-st · -nk · -nt · -tch。' },
    { title: 'Magic e (a_e / o_e)', desc: 'cake · home。' },
    { title: 'Magic e (i_e / u_e)', desc: 'bike · cute。' },
    { title: 'Rhyme Time', desc: '搵韻腳。' },
  ],
  eng_vocab: [
    { title: 'At School', desc: '學校同地方。' },
    { title: 'My Family', desc: '家人同朋友。' },
    { title: 'Food & Feelings', desc: '食物同感受。' },
    { title: 'Weather & Clothes', desc: '天氣同衣物。' },
    { title: 'Jobs & Doing', desc: '職業同活動。' },
  ],
  eng_grammar: [
    { title: 'a / an', desc: '正確用 a 或 an。' },
    { title: 'Plurals', desc: '單數變複數。' },
    { title: 'is / are / am', desc: 'be 動詞。' },
    { title: 'has / have / do', desc: '主語配對。' },
    { title: 'this / that / these', desc: '指示詞。' },
  ],
  eng_prepositions: [
    { title: 'in / on / under', desc: '位置介詞。' },
    { title: 'next to / behind', desc: '更多位置詞。' },
    { title: 'at / on / in (time)', desc: '時間介詞。' },
    { title: 'Where / What / How', desc: '疑問詞。' },
    { title: 'Which / Why / Who', desc: '更多疑問詞。' },
  ],
  eng_sentence: [
    { title: 'and / or', desc: '連接詞。' },
    { title: 'because', desc: '講原因。' },
    { title: 'I like + -ing', desc: '鍾意做乜。' },
    { title: 'Word Order', desc: '揀正確句子。' },
    { title: 'Capitals & Marks', desc: '大階字母同標點。' },
  ],
  eng_reading: [
    { title: 'Find the Detail', desc: '喺文章搵答案。' },
    { title: 'Main Idea', desc: '文章主要講咩？' },
    { title: 'Sequence', desc: '邊件事先發生？' },
    { title: 'Word Meaning', desc: '估生字意思。' },
    { title: 'True or False', desc: '判斷與推理。' },
  ],
};

type Item = { q: string; a: string; opts: string[]; passage?: string };

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// POOL[sectionId][levelIndex] = Item[]
const POOL: Record<string, Item[][]> = {
  eng_phonics: [
    // L1 — beginning blends
    [
      { q: "Which word starts with 'tr'?", a: 'train', opts: ['train', 'cat', 'sun', 'big'] },
      { q: "Which word starts with 'cl'?", a: 'clock', opts: ['clock', 'desk', 'frog', 'man'] },
      { q: "Which word starts with 'sp'?", a: 'spoon', opts: ['spoon', 'hat', 'bell', 'ring'] },
      { q: "Which word starts with 'dr'?", a: 'drum', opts: ['drum', 'fish', 'lamp', 'tree'] },
      { q: "Which word starts with 'pl'?", a: 'plane', opts: ['plane', 'cup', 'goat', 'milk'] },
      { q: "Which word starts with 'st'?", a: 'star', opts: ['star', 'duck', 'wall', 'jam'] },
    ],
    // L2 — ending sounds
    [
      { q: "Which word ends with 'nk'?", a: 'pink', opts: ['pink', 'cat', 'red', 'sun'] },
      { q: "Which word ends with 'st'?", a: 'nest', opts: ['nest', 'bird', 'frog', 'milk'] },
      { q: "Which word ends with 'tch'?", a: 'watch', opts: ['watch', 'book', 'lamp', 'ship'] },
      { q: "Which word ends with 'nt'?", a: 'tent', opts: ['tent', 'fish', 'gold', 'rope'] },
      { q: "Which word ends with 'nk'?", a: 'bank', opts: ['bank', 'door', 'tree', 'leaf'] },
      { q: "Which word ends with 'st'?", a: 'fast', opts: ['fast', 'jump', 'ring', 'corn'] },
    ],
    // L3 — magic e: a_e, o_e
    [
      { q: "Which word has the magic-e sound like 'cake'?", a: 'gate', opts: ['gate', 'cat', 'hat', 'bag'] },
      { q: "Which word has the magic-e sound like 'home'?", a: 'nose', opts: ['nose', 'dog', 'box', 'top'] },
      { q: "Add magic-e: 'cap' becomes ___ .", a: 'cape', opts: ['cape', 'caps', 'capp', 'cup'] },
      { q: "Which word rhymes with 'name'?", a: 'game', opts: ['game', 'gum', 'man', 'net'] },
      { q: "Which word has the long 'o' sound (like 'rope')?", a: 'bone', opts: ['bone', 'bot', 'pot', 'dot'] },
      { q: "Add magic-e: 'rob' becomes ___ .", a: 'robe', opts: ['robe', 'robs', 'rub', 'rib'] },
    ],
    // L4 — magic e: i_e, u_e
    [
      { q: "Which word has the magic-e sound like 'bike'?", a: 'kite', opts: ['kite', 'kit', 'sit', 'pig'] },
      { q: "Which word has the magic-e sound like 'cute'?", a: 'tube', opts: ['tube', 'cup', 'bus', 'nut'] },
      { q: "Add magic-e: 'pin' becomes ___ .", a: 'pine', opts: ['pine', 'pins', 'pan', 'pen'] },
      { q: "Which word rhymes with 'five'?", a: 'dive', opts: ['dive', 'dig', 'dog', 'duck'] },
      { q: "Which word has the long 'i' sound (like 'time')?", a: 'line', opts: ['line', 'lip', 'lid', 'log'] },
      { q: "Add magic-e: 'cub' becomes ___ .", a: 'cube', opts: ['cube', 'cubs', 'cab', 'cob'] },
    ],
    // L5 — rhyme time (mixed)
    [
      { q: "Which word rhymes with 'cat'?", a: 'hat', opts: ['hat', 'dog', 'sun', 'cup'] },
      { q: "Which word rhymes with 'play'?", a: 'day', opts: ['day', 'dog', 'pin', 'cup'] },
      { q: "Which word rhymes with 'star'?", a: 'car', opts: ['car', 'sit', 'box', 'leg'] },
      { q: "Which word rhymes with 'tree'?", a: 'bee', opts: ['bee', 'cat', 'top', 'mug'] },
      { q: "Which word rhymes with 'night'?", a: 'light', opts: ['light', 'note', 'lake', 'rope'] },
      { q: "Which word rhymes with 'snow'?", a: 'go', opts: ['go', 'see', 'run', 'big'] },
    ],
  ],
  eng_vocab: [
    // L1 — at school & places
    [
      { q: 'You borrow books in the ___.', a: 'library', opts: ['library', 'kitchen', 'garden', 'beach'] },
      { q: 'You learn lessons in a ___.', a: 'classroom', opts: ['classroom', 'bathroom', 'garage', 'shop'] },
      { q: 'Children play games in the ___.', a: 'playground', opts: ['playground', 'office', 'station', 'farm'] },
      { q: 'You write with a ___.', a: 'pencil', opts: ['pencil', 'plate', 'sock', 'door'] },
      { q: 'A teacher writes on the ___.', a: 'whiteboard', opts: ['whiteboard', 'pillow', 'spoon', 'shoe'] },
      { q: 'You eat lunch in the ___.', a: 'canteen', opts: ['canteen', 'library', 'pool', 'park'] },
    ],
    // L2 — family & friends
    [
      { q: "Your mother's mother is your ___.", a: 'grandmother', opts: ['grandmother', 'sister', 'aunt', 'cousin'] },
      { q: "Your father's brother is your ___.", a: 'uncle', opts: ['uncle', 'nephew', 'grandfather', 'niece'] },
      { q: 'Your brother and sister are your ___.', a: 'siblings', opts: ['siblings', 'parents', 'teachers', 'friends'] },
      { q: "Your mother's sister is your ___.", a: 'aunt', opts: ['aunt', 'uncle', 'cousin', 'grandfather'] },
      { q: "Your aunt's husband is your ___.", a: 'uncle', opts: ['uncle', 'cousin', 'brother', 'grandfather'] },
      { q: 'Your mum and dad are your ___.', a: 'parents', opts: ['parents', 'friends', 'pets', 'neighbours'] },
    ],
    // L3 — food & feelings
    [
      { q: 'I am ___. I want to eat now.', a: 'hungry', opts: ['hungry', 'sleepy', 'angry', 'tall'] },
      { q: 'It is winter. I feel ___.', a: 'cold', opts: ['cold', 'hot', 'happy', 'fast'] },
      { q: 'I got a present. I feel ___.', a: 'happy', opts: ['happy', 'sad', 'tired', 'sick'] },
      { q: 'You drink ___ in the morning.', a: 'milk', opts: ['milk', 'soap', 'sand', 'glue'] },
      { q: 'A sweet yellow fruit is a ___.', a: 'banana', opts: ['banana', 'carrot', 'chair', 'sock'] },
      { q: 'I am ___. I want to sleep.', a: 'sleepy', opts: ['sleepy', 'hungry', 'happy', 'cold'] },
    ],
    // L4 — weather, seasons & clothes
    [
      { q: 'It is raining. Take an ___.', a: 'umbrella', opts: ['umbrella', 'apple', 'pencil', 'spoon'] },
      { q: 'In winter we wear a warm ___.', a: 'coat', opts: ['coat', 'hat only', 'fan', 'kite'] },
      { q: 'The sun is out. It is a ___ day.', a: 'sunny', opts: ['sunny', 'snowy', 'foggy', 'windy'] },
      { q: 'We swim in the sea in ___.', a: 'summer', opts: ['summer', 'winter', 'autumn', 'morning'] },
      { q: 'Put on your ___ to keep your feet warm.', a: 'socks', opts: ['socks', 'gloves', 'cap', 'scarf'] },
      { q: 'It is cold and white outside. It is ___.', a: 'snowing', opts: ['snowing', 'sunny', 'hot', 'dry'] },
    ],
    // L5 — jobs & daily activities
    [
      { q: 'A ___ puts out fires.', a: 'firefighter', opts: ['firefighter', 'teacher', 'farmer', 'pilot'] },
      { q: 'A ___ helps sick people.', a: 'doctor', opts: ['doctor', 'driver', 'cook', 'singer'] },
      { q: 'A ___ flies a plane.', a: 'pilot', opts: ['pilot', 'nurse', 'baker', 'cleaner'] },
      { q: 'At home, I help wash the ___.', a: 'dishes', opts: ['dishes', 'clouds', 'stars', 'roads'] },
      { q: 'I ___ my teeth every morning.', a: 'brush', opts: ['brush', 'fly', 'swim', 'cook'] },
      { q: 'A ___ teaches students at school.', a: 'teacher', opts: ['teacher', 'farmer', 'pilot', 'doctor'] },
    ],
  ],
  eng_grammar: [
    // L1 — a / an
    [
      { q: 'I have ___ apple.', a: 'an', opts: ['an', 'a', 'the', 'two'] },
      { q: 'She has ___ book.', a: 'a', opts: ['a', 'an', 'two', 'some'] },
      { q: 'He saw ___ elephant.', a: 'an', opts: ['an', 'a', 'the', 'one'] },
      { q: 'We have ___ orange.', a: 'an', opts: ['an', 'a', 'this', 'that'] },
      { q: 'It is ___ umbrella.', a: 'an', opts: ['an', 'a', 'some', 'the'] },
      { q: 'I want ___ banana.', a: 'a', opts: ['a', 'an', 'two', 'those'] },
    ],
    // L2 — plurals
    [
      { q: 'one box, two ___', a: 'boxes', opts: ['boxes', 'boxs', 'box', 'boxies'] },
      { q: 'one child, two ___', a: 'children', opts: ['children', 'childs', 'childes', 'child'] },
      { q: 'one foot, two ___', a: 'feet', opts: ['feet', 'foots', 'feets', 'foot'] },
      { q: 'one cat, three ___', a: 'cats', opts: ['cats', 'cates', 'cat', 'catz'] },
      { q: 'one baby, two ___', a: 'babies', opts: ['babies', 'babys', 'babyes', 'baby'] },
      { q: 'one man, two ___', a: 'men', opts: ['men', 'mans', 'mens', 'man'] },
    ],
    // L3 — is / are / am
    [
      { q: 'The dogs ___ hungry.', a: 'are', opts: ['are', 'is', 'am', 'be'] },
      { q: 'She ___ my friend.', a: 'is', opts: ['is', 'are', 'am', 'be'] },
      { q: 'I ___ a student.', a: 'am', opts: ['am', 'is', 'are', 'be'] },
      { q: 'The book ___ on the desk.', a: 'is', opts: ['is', 'are', 'am', 'were'] },
      { q: 'They ___ happy.', a: 'are', opts: ['are', 'is', 'am', 'was'] },
      { q: 'My brother and I ___ tall.', a: 'are', opts: ['are', 'is', 'am', 'be'] },
    ],
    // L4 — has / have / do / does
    [
      { q: 'She ___ a cat.', a: 'has', opts: ['has', 'have', 'haves', 'having'] },
      { q: 'They ___ two dogs.', a: 'have', opts: ['have', 'has', 'haves', 'had'] },
      { q: 'He ___ long hair.', a: 'has', opts: ['has', 'have', 'is', 'are'] },
      { q: 'We ___ a big garden.', a: 'have', opts: ['have', 'has', 'is', 'are'] },
      { q: '___ she like apples?', a: 'Does', opts: ['Does', 'Do', 'Is', 'Are'] },
      { q: '___ they play football?', a: 'Do', opts: ['Do', 'Does', 'Is', 'Has'] },
    ],
    // L5 — this / that / these / those
    [
      { q: '___ apples (here) are sweet.', a: 'These', opts: ['These', 'This', 'That', 'It'] },
      { q: '___ (here, one) is my pen.', a: 'This', opts: ['This', 'These', 'Those', 'Are'] },
      { q: 'Look at ___ birds over there.', a: 'those', opts: ['those', 'that', 'this', 'these'] },
      { q: '___ dog over there is big.', a: 'That', opts: ['That', 'These', 'Those', 'Them'] },
      { q: 'I like ___ shoes (here).', a: 'these', opts: ['these', 'this', 'that', 'it'] },
      { q: '___ (one) is a nice hat.', a: 'This', opts: ['This', 'These', 'Those', 'Them'] },
    ],
  ],
  eng_prepositions: [
    // L1 — in / on / under
    [
      { q: 'The book is ___ the table (on top).', a: 'on', opts: ['on', 'in', 'under', 'next to'] },
      { q: 'The ball is ___ the box (inside).', a: 'in', opts: ['in', 'on', 'under', 'behind'] },
      { q: 'The dog is ___ the table (below).', a: 'under', opts: ['under', 'on', 'in', 'above'] },
      { q: 'The cat is ___ the bed (below).', a: 'under', opts: ['under', 'on', 'in', 'between'] },
      { q: 'The pen is ___ the bag (inside).', a: 'in', opts: ['in', 'on', 'under', 'next to'] },
      { q: 'The picture is ___ the wall.', a: 'on', opts: ['on', 'in', 'under', 'between'] },
    ],
    // L2 — next to / behind / between / in front of
    [
      { q: 'The bag is ___ the chair (beside).', a: 'next to', opts: ['next to', 'in', 'under', 'on'] },
      { q: 'The cat is ___ the door (at the back).', a: 'behind', opts: ['behind', 'in front of', 'in', 'on'] },
      { q: 'The boy stands ___ the two trees.', a: 'between', opts: ['between', 'on', 'under', 'in'] },
      { q: 'The car is ___ the house (before it).', a: 'in front of', opts: ['in front of', 'behind', 'in', 'on'] },
      { q: 'The lamp is ___ the desk (above).', a: 'above', opts: ['above', 'under', 'in', 'behind'] },
      { q: 'She sits ___ me (beside).', a: 'next to', opts: ['next to', 'in', 'on', 'under'] },
    ],
    // L3 — at / on / in (time)
    [
      { q: 'We get up ___ six o’clock.', a: 'at', opts: ['at', 'on', 'in', 'by'] },
      { q: 'We go to school ___ Monday.', a: 'on', opts: ['on', 'at', 'in', 'by'] },
      { q: 'I read books ___ the morning.', a: 'in', opts: ['in', 'at', 'on', 'by'] },
      { q: 'My birthday is ___ May.', a: 'in', opts: ['in', 'on', 'at', 'by'] },
      { q: 'The party starts ___ three o’clock.', a: 'at', opts: ['at', 'on', 'in', 'to'] },
      { q: 'We have a holiday ___ Sunday.', a: 'on', opts: ['on', 'at', 'in', 'by'] },
    ],
    // L4 — where / what / how
    [
      { q: '___ do you live? I live in Sha Tin.', a: 'Where', opts: ['Where', 'What', 'How', 'Who'] },
      { q: '___ is your name? My name is Tom.', a: 'What', opts: ['What', 'Where', 'How', 'Why'] },
      { q: '___ do you come to school? By bus.', a: 'How', opts: ['How', 'What', 'Where', 'Who'] },
      { q: '___ is the library? On the first floor.', a: 'Where', opts: ['Where', 'What', 'How', 'When'] },
      { q: '___ are you? I am fine, thank you.', a: 'How', opts: ['How', 'What', 'Where', 'Why'] },
      { q: '___ time is it? It is two o’clock.', a: 'What', opts: ['What', 'How', 'Where', 'Who'] },
    ],
    // L5 — which / why / who
    [
      { q: '___ season do you like best? I like summer.', a: 'Which', opts: ['Which', 'Why', 'Who', 'Where'] },
      { q: '___ do you like Easter? Because I eat eggs.', a: 'Why', opts: ['Why', 'Which', 'How', 'What'] },
      { q: '___ is that boy? He is my brother.', a: 'Who', opts: ['Who', 'Which', 'Why', 'Where'] },
      { q: '___ one is yours, the red or the blue?', a: 'Which', opts: ['Which', 'Why', 'Who', 'How'] },
      { q: '___ are you sad? Because I lost my toy.', a: 'Why', opts: ['Why', 'Who', 'Which', 'What'] },
      { q: '___ is your teacher? Miss Chan is.', a: 'Who', opts: ['Who', 'Why', 'Which', 'Where'] },
    ],
  ],
  eng_sentence: [
    // L1 — and / or
    [
      { q: 'I like apples ___ oranges.', a: 'and', opts: ['and', 'but', 'so', 'because'] },
      { q: 'Do you want tea ___ coffee?', a: 'or', opts: ['or', 'and', 'but', 'so'] },
      { q: 'I have a cat ___ a dog.', a: 'and', opts: ['and', 'but', 'or', 'because'] },
      { q: 'We sing ___ dance at the party.', a: 'and', opts: ['and', 'but', 'or', 'so'] },
      { q: 'Is it big ___ small?', a: 'or', opts: ['or', 'and', 'so', 'because'] },
      { q: 'She has a pen ___ a ruler.', a: 'and', opts: ['and', 'or', 'but', 'because'] },
    ],
    // L2 — because
    [
      { q: 'I ate lunch ___ I was hungry.', a: 'because', opts: ['because', 'so', 'but', 'and'] },
      { q: 'We stayed home ___ it was raining.', a: 'because', opts: ['because', 'so', 'but', 'and'] },
      { q: 'I like her ___ she is kind.', a: 'because', opts: ['because', 'so', 'but', 'and'] },
      { q: 'He is happy ___ it is his birthday.', a: 'because', opts: ['because', 'or', 'but', 'and'] },
      { q: 'I drank water ___ I was thirsty.', a: 'because', opts: ['because', 'so', 'and', 'or'] },
      { q: 'We like summer ___ we can swim.', a: 'because', opts: ['because', 'but', 'or', 'and'] },
    ],
    // L3 — I like + -ing
    [
      { q: 'I like ___ moon cakes at Mid-Autumn Festival.', a: 'eating', opts: ['eating', 'eat', 'ate', 'eats'] },
      { q: 'She likes ___ in the park.', a: 'playing', opts: ['playing', 'play', 'played', 'plays'] },
      { q: 'We like ___ to music.', a: 'listening', opts: ['listening', 'listen', 'listens', 'listened'] },
      { q: 'He likes ___ books at night.', a: 'reading', opts: ['reading', 'read', 'reads', 'readed'] },
      { q: 'They like ___ football after school.', a: 'playing', opts: ['playing', 'play', 'plays', 'played'] },
      { q: 'I like ___ pictures.', a: 'drawing', opts: ['drawing', 'draw', 'draws', 'drew'] },
    ],
    // L4 — word order
    [
      { q: 'Which sentence is correct?', a: 'She plays tennis.', opts: ['She plays tennis.', 'Plays she tennis.', 'Tennis she plays.', 'She tennis plays.'] },
      { q: 'Which sentence is correct?', a: 'I am happy.', opts: ['I am happy.', 'Am I happy.', 'Happy I am.', 'I happy am.'] },
      { q: 'Which sentence is correct?', a: 'We like cake.', opts: ['We like cake.', 'Cake we like.', 'Like we cake.', 'We cake like.'] },
      { q: 'Which sentence is correct?', a: 'He is my friend.', opts: ['He is my friend.', 'My friend he is.', 'Is he my friend.', 'He my friend is.'] },
      { q: 'Which sentence is correct?', a: 'They play football.', opts: ['They play football.', 'Football they play.', 'Play they football.', 'They football play.'] },
      { q: 'Which sentence is correct?', a: 'The cat is black.', opts: ['The cat is black.', 'Black the cat is.', 'Is the cat black.', 'Cat the is black.'] },
    ],
    // L5 — capitals & punctuation
    [
      { q: 'Which sentence is correct?', a: 'I live in Hong Kong.', opts: ['I live in Hong Kong.', 'i live in hong kong.', 'I Live In Hong kong.', 'i Live in Hong Kong.'] },
      { q: 'What goes at the end of a question?', a: '?', opts: ['?', '.', ',', '!'] },
      { q: 'Which sentence is correct?', a: 'My name is Tom.', opts: ['My name is Tom.', 'my name is tom.', 'My Name Is Tom.', 'my name is Tom.'] },
      { q: 'What goes at the end of a telling sentence?', a: '.', opts: ['.', '?', ',', ':'] },
      { q: 'Which word needs a capital letter?', a: 'Monday', opts: ['Monday', 'apple', 'run', 'blue'] },
      { q: 'Which sentence is correct?', a: 'Do you like tea?', opts: ['Do you like tea?', 'do you like tea.', 'Do you like tea.', 'do you like tea?'] },
    ],
  ],
  // Reading comprehension: short passage + question; answer options carry
  // Chinese glosses (中文) next to difficult words, shown ONLY in the review.
  eng_reading: [
    // L1 — find the detail
    [
      { passage: 'Tom has a red bag. He puts his books and a blue pen in it. He likes his bag very much.', q: "What colour is Tom's bag?", a: 'red (紅色)', opts: ['red (紅色)', 'blue (藍色)', 'green (綠色)', 'yellow (黃色)'] },
      { passage: 'Mary went to the park on Sunday. She played with her dog, Lucky. They had lots of fun.', q: 'Who did Mary play with?', a: 'her dog (佢隻狗)', opts: ['her dog (佢隻狗)', 'her cat (佢隻貓)', 'her friend (佢朋友)', 'her mother (佢媽媽)'] },
      { passage: 'It was raining. Ben stayed at home and read a book about animals.', q: 'What did Ben read about?', a: 'animals (動物)', opts: ['animals (動物)', 'cars (汽車)', 'food (食物)', 'sports (運動)'] },
      { passage: 'Sara has three pets: a cat, a fish and a bird. The bird can sing.', q: 'How many pets does Sara have?', a: 'three (三隻)', opts: ['three (三隻)', 'two (兩隻)', 'four (四隻)', 'five (五隻)'] },
      { passage: 'At school, Anna helps her teacher. She gives out the books every morning.', q: 'What does Anna give out?', a: 'books (書)', opts: ['books (書)', 'pens (筆)', 'cups (杯)', 'bags (袋)'] },
      { passage: 'We help at home. I wash the dishes and my brother sweeps the floor.', q: 'What does the brother do?', a: 'sweeps the floor (掃地)', opts: ['sweeps the floor (掃地)', 'washes the dishes (洗碗)', 'cooks (煮飯)', 'reads (睇書)'] },
    ],
    // L2 — main idea
    [
      { passage: 'Pandas are black and white. They live in China. They eat bamboo (竹) all day.', q: 'What is this passage mostly about?', a: 'pandas (熊貓)', opts: ['pandas (熊貓)', 'tigers (老虎)', 'cities (城市)', 'chairs (櫈)'] },
      { passage: 'My family went to the beach. We swam in the sea and built a sandcastle (沙堡). It was a wonderful day.', q: 'What is the main idea?', a: 'a fun day at the beach (海灘開心嘅一日)', opts: ['a fun day at the beach (海灘開心嘅一日)', 'a day at school (返學嘅一日)', 'a rainy day (落雨天)', 'a birthday party (生日會)'] },
      { passage: 'At Mid-Autumn Festival, we eat moon cakes (月餅). We play with lanterns (燈籠) at night. We are happy.', q: 'What is this passage about?', a: 'Mid-Autumn Festival (中秋節)', opts: ['Mid-Autumn Festival (中秋節)', 'a sports day (運動會)', 'going to school (返學)', 'a rainy day (落雨天)'] },
      { passage: 'We must help at home. I make my bed and feed the cat. Helping is good.', q: 'What is the main idea?', a: 'helping at home (喺屋企幫手)', opts: ['helping at home (喺屋企幫手)', 'going to the zoo (去動物園)', 'playing games (玩遊戲)', 'eating cake (食蛋糕)'] },
      { passage: 'In winter it is cold. We wear coats and gloves (手套). We drink hot soup.', q: 'What is this passage mostly about?', a: 'winter (冬天)', opts: ['winter (冬天)', 'summer (夏天)', 'a party (派對)', 'school (學校)'] },
    ],
    // L3 — sequence
    [
      { passage: 'First, Anna woke up. Then she brushed her teeth. After that, she ate breakfast.', q: 'What did Anna do first?', a: 'woke up (起身)', opts: ['woke up (起身)', 'ate breakfast (食早餐)', 'brushed her teeth (刷牙)', 'went to school (返學)'] },
      { passage: 'Ben put on his shoes. Then he rode his bike to the park. Finally, he played football.', q: 'What did Ben do last?', a: 'played football (踢波)', opts: ['played football (踢波)', 'put on his shoes (著鞋)', 'rode his bike (踩單車)', 'woke up (起身)'] },
      { passage: 'Mum mixed the eggs. Then she baked the cake. At last, we ate it together.', q: 'What did Mum do before baking the cake?', a: 'mixed the eggs (撈蛋)', opts: ['mixed the eggs (撈蛋)', 'ate the cake (食蛋糕)', 'washed the plates (洗碟)', 'bought milk (買奶)'] },
      { passage: 'First we washed our hands. Next we set the table. Then we had dinner.', q: 'What did they do after washing hands?', a: 'set the table (擺枱)', opts: ['set the table (擺枱)', 'had dinner (食晚飯)', 'went to bed (瞓覺)', 'cooked (煮飯)'] },
      { passage: 'The seed grew into a small plant. Later, it became a big tree. Birds made a nest (鳥巢) in it.', q: 'What happened first?', a: 'the seed grew (種子發芽)', opts: ['the seed grew (種子發芽)', 'it became a big tree (變大樹)', 'birds made a nest (雀仔築巢)', 'it had fruit (結果)'] },
    ],
    // L4 — word meaning in context
    [
      { passage: 'The elephant is huge. It is the biggest animal at the zoo.', q: "What does 'huge' mean?", a: 'very big (好大)', opts: ['very big (好大)', 'very small (好細)', 'very fast (好快)', 'very old (好舊)'] },
      { passage: 'Tom was glad to see his friend. He smiled and said hello.', q: "What does 'glad' mean?", a: 'happy (開心)', opts: ['happy (開心)', 'sad (傷心)', 'angry (嬲)', 'tired (攰)'] },
      { passage: 'The room was tidy. Everything was in the right place.', q: "What does 'tidy' mean?", a: 'clean and neat (乾淨整齊)', opts: ['clean and neat (乾淨整齊)', 'dirty (污糟)', 'dark (黑暗)', 'noisy (嘈吵)'] },
      { passage: 'The puppy is tiny. It can sit in my hand.', q: "What does 'tiny' mean?", a: 'very small (好細)', opts: ['very small (好細)', 'very big (好大)', 'very heavy (好重)', 'very tall (好高)'] },
      { passage: 'Ben felt scared when he heard a loud noise in the dark.', q: "What does 'scared' mean?", a: 'afraid (驚)', opts: ['afraid (驚)', 'happy (開心)', 'hungry (肚餓)', 'sleepy (眼瞓)'] },
      { passage: 'The soup was hot, so Mary ate it slowly.', q: "What does 'slowly' mean?", a: 'not fast (唔快)', opts: ['not fast (唔快)', 'very fast (好快)', 'very loud (好大聲)', 'very late (好遲)'] },
    ],
    // L5 — true/false & simple inference
    [
      { passage: 'Lily likes apples and bananas. She does not like oranges.', q: 'Which one is TRUE?', a: 'Lily likes apples (Lily鍾意蘋果)', opts: ['Lily likes apples (Lily鍾意蘋果)', 'Lily likes oranges (Lily鍾意橙)', 'Lily hates bananas (Lily憎香蕉)', 'Lily likes grapes (Lily鍾意提子)'] },
      { passage: 'It is snowing outside. The children are wearing warm coats and gloves (手套).', q: 'What can you tell?', a: 'It is cold (天氣凍)', opts: ['It is cold (天氣凍)', 'It is hot (天氣熱)', 'It is summer (而家夏天)', 'They are swimming (佢哋游緊水)'] },
      { passage: 'Sam finished all his homework before dinner. His mother was proud (自豪) of him.', q: 'Which one is TRUE?', a: 'Sam finished his homework (Sam做完功課)', opts: ['Sam finished his homework (Sam做完功課)', 'Sam did not do homework (Sam無做功課)', 'Sam was sleeping (Sam瞓緊覺)', 'Sam was crying (Sam喊緊)'] },
      { passage: 'Ann took her umbrella and raincoat before going out.', q: 'What is the weather probably like?', a: 'rainy (落雨)', opts: ['rainy (落雨)', 'sunny (晴天)', 'snowy (落雪)', 'only windy (得風)'] },
      { passage: 'Ken helps his mum cook and wash the dishes every day. He is a good boy.', q: 'Which one is TRUE?', a: 'Ken helps at home (Ken幫手做家務)', opts: ['Ken helps at home (Ken幫手做家務)', 'Ken never helps (Ken從不幫手)', 'Ken is a baby (Ken係嬰兒)', 'Ken cannot cook (Ken唔識煮)'] },
    ],
  ],
};

// "candles (蠟燭)" -> { plain: "candles", gloss: "蠟燭" }
const splitGloss = (s: string): { plain: string; gloss: string } => {
  const m = s.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  return m ? { plain: m[1].trim(), gloss: m[2].trim() } : { plain: s, gloss: '' };
};

export function generateEnglishQuestions(sectionId: string, level: number, count = 5): Question[] {
  const pool = (POOL[sectionId] && POOL[sectionId][level]) || [];
  const picked = shuffle(pool).slice(0, count);
  while (picked.length < count && pool.length > 0) picked.push(pool[picked.length % pool.length]);
  return picked.map((it) => {
    const glosses: Record<string, string> = {};
    const plainOpts = it.opts.map((o) => {
      const { plain, gloss } = splitGloss(o);
      if (gloss) glosses[plain] = gloss;
      return plain;
    });
    const plainAnswer = splitGloss(it.a).plain;
    let options = shuffle(plainOpts);
    if (!options.includes(plainAnswer)) options = [plainAnswer, ...options].slice(0, 4);
    const hasGloss = Object.keys(glosses).length > 0;
    return {
      text: it.q,
      answer: plainAnswer,
      options,
      passage: it.passage,
      glosses: hasGloss ? glosses : undefined,
    };
  });
}
