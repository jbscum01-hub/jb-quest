const QUEST_COLORS = {
  MEDIC: 0x9fd0f5,
  FARMER: 0xb5e795,
  SOLDIER: 0x1c3d19,
  FISHER: 0x325deb,
  HUNTER: 0xf1b766,
  EXPLORER: 0x743825,
  CHEF: 0xfaf376,
  ENGINEER: 0x95A5A6,
  AVIATION: 0x206694,

  LEGENDARY: 0xF1C40F,
  SPECIAL: 0xFF66CC,

  DEFAULT: 0x2C2F33,
  STATUS_REJECT: 0xE74C3C,
  STATUS_PENDING: 0xF1C40F
};

function getQuestColor(quest = {}) {
  if (quest.category_code && QUEST_COLORS[quest.category_code]) {
    return QUEST_COLORS[quest.category_code];
  }

  if (quest.profession_code && QUEST_COLORS[quest.profession_code]) {
    return QUEST_COLORS[quest.profession_code];
  }

  return QUEST_COLORS.DEFAULT;
}

function getReviewColor({ quest = {}, action = '' } = {}) {
  if (action === 'approve') {
    return getQuestColor(quest);
  }

  if (action === 'reject') {
    return QUEST_COLORS.STATUS_REJECT;
  }

  return QUEST_COLORS.STATUS_PENDING;
}

module.exports = {
  QUEST_COLORS,
  getQuestColor,
  getReviewColor
};
