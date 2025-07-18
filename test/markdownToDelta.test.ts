import { it, expect, describe } from 'vitest'
import markdownToDelta, { Handle } from '../src/markdownToDelta'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { selectAll } from 'unist-util-select'
import { syntax } from 'micromark-extension-wiki-link'
import * as wikiLink from 'mdast-util-wiki-link'
import { Link, Node } from 'mdast'

describe('markdownToDelta', () => {
  it('should convert markdown to delta', () => {
    const input = '# Hello, **world**!'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        insert: 'Hello, ',
      },
      {
        attributes: {
          bold: true,
        },
        insert: 'world',
      },
      {
        insert: '!',
      },
      {
        attributes: {
          header: 1,
        },
        insert: '\n',
      },
    ])
  })
  it('should convert markdown bold to delta', () => {
    const input = '**Hello, world!**'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          bold: true,
        },
        insert: 'Hello, world!',
      },
      { insert: '\n' },
    ])
  })
  it('should convert markdown italic to delta', () => {
    const input = '_Hello, world!_'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          italic: true,
        },
        insert: 'Hello, world!',
      },
      { insert: '\n' },
    ])
  })
  it('should convert markdown strikethrough to delta', () => {
    const input = '~~Hello, world!~~'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      { insert: 'Hello, world!', attributes: { strike: true } },
      { insert: '\n' },
    ])
  })
  it('should convert markdown bold and italic to delta', () => {
    const input = '**_Hello, world!_**'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          italic: true,
          bold: true,
        },
        insert: 'Hello, world!',
      },
      { insert: '\n' },
    ])
  })
  it('should convert markdown italic and bold to delta', () => {
    const input = '_**Hello, world!**_'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          italic: true,
          bold: true,
        },
        insert: 'Hello, world!',
      },
      { insert: '\n' },
    ])
  })
  it('should convert markdown italic and bold and strikethrough to delta', () => {
    const input = '_**~~Hello, world!~~**_'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          italic: true,
          bold: true,
          strike: true,
        },
        insert: 'Hello, world!',
      },
      { insert: '\n' },
    ])
  })
  it('should convert markdown heading to delta', () => {
    const input = '# Hello, world!'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      { insert: 'Hello, world!' },
      { insert: '\n', attributes: { header: 1 } },
    ])
  })
  it('should convert markdown list to delta', () => {
    const input = '- task1\n- task2'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        insert: 'task1',
      },
      {
        attributes: {
          list: 'bullet',
        },
        insert: '\n',
      },
      {
        insert: 'task2',
      },
      {
        attributes: {
          list: 'bullet',
        },
        insert: '\n',
      },
    ])
  })
  it('should convert markdown ordered list to delta', () => {
    const input = '1. task1\n2. task2'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        insert: 'task1',
      },
      {
        attributes: {
          list: 'ordered',
        },
        insert: '\n',
      },
      {
        insert: 'task2',
      },
      {
        attributes: {
          list: 'ordered',
        },
        insert: '\n',
      },
    ])
  })
  it('should convert markdown task list to delta', () => {
    const input = '- [ ] task1\n- [x] task2'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        insert: 'task1',
      },
      {
        attributes: {
          list: 'unchecked',
        },
        insert: '\n',
      },
      {
        insert: 'task2',
      },
      {
        attributes: {
          list: 'checked',
        },
        insert: '\n',
      },
    ])
  })
  it('should merge consecutive ordered lists separated by bullet lists', () => {
    const input = `1. **First Item**
* Description for first item.

2. **Second Item**
* Description for second item.

3. **Third Item**
* Description for third item.

4. **Fourth Item**
* Description for fourth item.`
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        insert: 'First Item',
        attributes: {
          bold: true,
        },
      },
      {
        insert: '\n',
        attributes: {
          list: 'ordered',
        },
      },
      {
        insert: 'Description for first item.',
      },
      {
        insert: '\n',
        attributes: {
          list: 'bullet',
        },
      },
      {
        insert: 'Second Item',
        attributes: {
          bold: true,
        },
      },
      {
        insert: '\n',
        attributes: {
          list: 'ordered',
        },
      },
      {
        insert: 'Description for second item.',
      },
      {
        insert: '\n',
        attributes: {
          list: 'bullet',
        },
      },
      {
        insert: 'Third Item',
        attributes: {
          bold: true,
        },
      },
      {
        insert: '\n',
        attributes: {
          list: 'ordered',
        },
      },
      {
        insert: 'Description for third item.',
      },
      {
        insert: '\n',
        attributes: {
          list: 'bullet',
        },
      },
      {
        insert: 'Fourth Item',
        attributes: {
          bold: true,
        },
      },
      {
        insert: '\n',
        attributes: {
          list: 'ordered',
        },
      },
      {
        insert: 'Description for fourth item.',
      },
      {
        insert: '\n',
        attributes: {
          list: 'bullet',
        },
      },
    ])
  })
  it('should convert markdown blockquote to delta', () => {
    const input = '> Hello, world!'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        insert: 'Hello, world!',
      },
      {
        attributes: {
          blockquote: true,
        },
        insert: '\n',
      },
    ])
  })
  it('should convert markdown code to delta', () => {
    const input = '`Hello, world!`'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          code: true,
        },
        insert: 'Hello, world!',
      },
      {
        insert: '\n',
      },
    ])
  })
  it('should convert markdown link to delta', () => {
    const input = '[Hello, world!](https://example.com)'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          link: 'https://example.com',
        },
        insert: 'Hello, world!',
      },
      {
        insert: '\n',
      },
    ])
  })
  it('should convert markdown image to delta', () => {
    const input = '![Hello, world!](https://picsum.photos/200)'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          alt: 'Hello, world!',
        },
        insert: {
          image: 'https://picsum.photos/200',
        },
      },
      {
        insert: '\n',
      },
    ])
  })
  it('should convert markdown code block to delta', () => {
    const input = '```ts\nconsole.log("Hello, world!");\n```'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        insert: 'console.log("Hello, world!");',
      },
      {
        attributes: {
          'code-block': true,
        },
        insert: '\n',
      },
    ])
  })
  it('should convert markdown list and strong to delta', () => {
    const input = `- **milk**
- cheese
`
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        attributes: {
          bold: true,
        },
        insert: 'milk',
      },
      {
        attributes: {
          list: 'bullet',
        },
        insert: '\n',
      },
      {
        insert: 'cheese',
      },
      {
        attributes: {
          list: 'bullet',
        },
        insert: '\n',
      },
    ])
  })
})

describe('custom extension', () => {
  it('should convert markdown horizontal rule to delta', () => {
    const input = 'a\n\n---\n\nb'
    const thematicBreak: Handle = ({ node, ops }) => {
      if (node.type !== 'thematicBreak') {
        return
      }
      ops.push({
        attributes: {
          class: 'cut-off',
        },
        insert: {
          'cut-off': {
            type: '0',
            url: 'https://i0.hdslb.com/bfs/article/0117cbba35e51b0bce5f8c2f6a838e8a087e8ee7.png',
          },
        },
      })
      return true
    }
    const delta = markdownToDelta(input, {
      handle: thematicBreak,
    })
    expect(delta).toEqual([
      {
        insert: 'a',
      },
      {
        insert: '\n',
      },
      {
        attributes: {
          class: 'cut-off',
        },
        insert: {
          'cut-off': {
            type: '0',
            url: 'https://i0.hdslb.com/bfs/article/0117cbba35e51b0bce5f8c2f6a838e8a087e8ee7.png',
          },
        },
      },
      {
        insert: 'b',
      },
      {
        insert: '\n',
      },
    ])
  })
  it('custom markdown parser', () => {
    const input = fromMarkdown(
      '[[https://example.com]]\n[[https://www.youtube.com/watch?v=XRZ-jLOrFfk]]',
      {
        extensions: [syntax()],
        mdastExtensions: [wikiLink.fromMarkdown()],
      },
    )
    interface WikiLink extends Node {
      value: string
      data: {
        alias: string
        permalink: string
        exists: boolean
        hName: string
        hProperties: Record<string, unknown>
        hChildren: Node[]
      }
    }
    const delta = markdownToDelta(input, {
      handle: ({ node, ancestors, ops, process }) => {
        if (node.type !== 'wikiLink') {
          return
        }
        const link = node as WikiLink
        if (!link.data.alias.startsWith('//www.youtube.com/watch?v=')) {
          process(
            {
              type: 'link',
              url: link.value + link.data.alias,
              children: [
                {
                  type: 'text',
                  value: link.value,
                },
              ],
            } as Link,
            ancestors,
          )
          return true
        }
        ops.push({
          insert: {
            video: link.value + link.data.alias,
          },
          attributes: {
            bold: true,
          },
        })
        return true
      },
    })
    expect(delta).toEqual([
      { insert: 'https', attributes: { link: 'https//example.com' } },
      { insert: '\n' },
      {
        insert: { video: 'https//www.youtube.com/watch?v=XRZ-jLOrFfk' },
        attributes: { bold: true },
      },
      { insert: '\n' },
    ])
  })
})

describe('unsupport', () => {
  it('should convert markdown table to delta', () => {
    const input = 'name|age\n-|-\ntest|17'
    const delta = markdownToDelta(input)
    expect(delta).toEqual([
      {
        insert: toMarkdown(
          fromMarkdown('name|age\n-|-\ntest|17', {
            extensions: [gfm()],
            mdastExtensions: [gfmFromMarkdown()],
          }),
          {
            extensions: [gfmToMarkdown()],
          },
        ),
      },
    ])
  })
})
