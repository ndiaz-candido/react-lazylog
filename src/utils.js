import { List, Range } from 'immutable';
import reactStringReplace from 'react-string-replace';

export const ENCODED_NEWLINE = 10; // \n
export const ENCODED_CARRIAGE_RETURN = 13; // \r

export const isNewline = current =>
  current === ENCODED_NEWLINE || current === ENCODED_CARRIAGE_RETURN;

export const getScrollIndex = ({
  follow = false,
  scrollToLine = 0,
  previousCount = 0,
  count = 0,
  offset = 0,
}) => {
  if (follow) {
    return count - 1 - offset;
  } else if (scrollToLine && previousCount > scrollToLine) {
    return -1;
  } else if (scrollToLine) {
    return scrollToLine - 1 - offset;
  }

  return -1;
};

export const getHighlightRange = highlight => {
  if (!highlight) {
    return Range(0, 0);
  }

  if (!Array.isArray(highlight)) {
    return Range(highlight, highlight + 1);
  }

  if (highlight.length === 1) {
    return Range(highlight[0], highlight[0] + 1);
  }

  return Range(highlight[0], highlight[1] + 1);
};

export const bufferConcat = (a, b) => {
  const buffer = new Uint8Array(a.length + b.length);

  buffer.set(a, 0);
  buffer.set(b, a.length);

  return buffer;
};

export const convertBufferToLines = (current, previous) => {
  const buffer = previous ? bufferConcat(previous, current) : current;
  const { length } = buffer;
  let lastNewlineIndex = 0;
  let index = 0;
  const lines = List().withMutations(lines => {
    while (index < length) {
      const current = buffer[index];
      const next = buffer[index + 1];

      if (isNewline(current, next)) {
        lines.push(buffer.subarray(lastNewlineIndex, index));
        lastNewlineIndex =
          current === ENCODED_CARRIAGE_RETURN && next === ENCODED_NEWLINE
            ? index + 2
            : index + 1;

        index = lastNewlineIndex;
      } else {
        index += 1;
      }
    }
  });

  return {
    lines,
    remaining:
      index !== lastNewlineIndex ? buffer.slice(lastNewlineIndex) : null,
  };
};

export const getLinesLengthRanges = rawLog => {
  const { length } = rawLog;
  const linesRanges = [];
  let lastNewlineIndex = 0;
  let index = 0;

  while (index < length) {
    const current = rawLog[index];
    const next = rawLog[index + 1];

    if (isNewline(current, next)) {
      lastNewlineIndex =
        current === ENCODED_CARRIAGE_RETURN && next === ENCODED_NEWLINE
          ? index + 2
          : index + 1;

      index = lastNewlineIndex;
      linesRanges.push(index);
    } else {
      index += 1;
    }
  }

  return linesRanges;
};

export const searchFormatPart = ({
  searchKeywords,
  nextFormatPart,
  replaceJsx,
}) => part => {
  let formattedPart = part;

  if (nextFormatPart) {
    formattedPart = nextFormatPart(part);
  }

  if (part.indexOf(searchKeywords) > -1) {
    return reactStringReplace(formattedPart, searchKeywords, replaceJsx);
  }

  return formattedPart;
};

export const concatenateUint8Arrays = (...arrays) => {
  let totalLength = 0;

  arrays.forEach(array => {
    totalLength += array.length;
  });

  const result = new Uint8Array(totalLength);
  let offset = 0;

  arrays.forEach(array => {
    result.set(array, offset);
    offset += array.length;
  });

  return result;
};
