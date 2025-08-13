/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import {MessageEntity} from '../../layer';
import encodeSpoiler from './encodeSpoiler';

export default function wrapPlainText(text: string, entities: MessageEntity[] = []) {
  entities.forEach((entity) => {
    if(entity._ === 'messageEntitySpoiler') {
      text = encodeSpoiler(text, entity).text;
    }
  });

  return text.replace(/[&<>"']/g, (char) => {
    switch(char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#39;';
      default:
        return char;
    }
  });
}
