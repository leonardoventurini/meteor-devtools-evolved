import { Classes, Drawer } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

interface Props {
  isAboutVisible: boolean;
  onClose(): void;
}

export const About: FunctionComponent<Props> = ({
  isAboutVisible,
  onClose,
}) => {
  return (
    <Drawer
      icon='help'
      title='About'
      isOpen={isAboutVisible}
      onClose={onClose}
      size='72%'
    >
      <div className={Classes.DRAWER_BODY}>
        <div className={Classes.DIALOG_BODY}>
          <h1>Basics</h1>

          <p>
            <em>Behold, the evolution of Meteor DevTools.</em>
          </p>

          <p>
            <a
              href='https://github.com/leonardoventurini/meteor-devtools-evolved/blob/development/CHANGELOG.md'
              target='_blank'
              rel='noopener noreferrer'
            >
              Change Log
            </a>
          </p>

          <p>
            <a
              href='https://github.com/leonardoventurini/meteor-devtools-evolved/blob/development/ROADMAP.md'
              target='_blank'
              rel='noopener noreferrer'
            >
              Roadmap
            </a>
          </p>

          <p>
            The extension initializes with the page content, which means you
            have to refresh the page after installation, also it needs the
            devtools panel to be opened at least once in the current tab for any
            messages to be processed.
          </p>

          <p>
            Other than that you can just explore the extension at your leisure.
            It should be easy enough.
          </p>

          <h1>Feedback</h1>

          <p>
            Any feedback you might have can be addressed directly at our{' '}
            <a
              href='https://github.com/leonardoventurini/meteor-devtools-evolved/issues'
              target='_blank'
              rel='noopener noreferrer'
            >
              GitHub Issues
            </a>{' '}
            page, that way we can discuss and transition into development more
            easily. You can also reach the author on the{' '}
            <a
              href='https://join.slack.com/t/meteor-community/shared_invite/zt-a9lwcfb7-~UwR3Ng6whEqRxcP5rORZw'
              target='_blank'
              rel='noopener noreferrer'
            >
              Meteor Community Slack
            </a>{' '}
            or the{' '}
            <a
              href='https://forums.meteor.com/'
              target='_blank'
              rel='noopener noreferrer'
            >
              Meteor Forums
            </a>
            .
          </p>

          <p>
            Starring the project is the easiest way to support the work and be
            part of our community of{' '}
            <a
              href='https://github.com/leonardoventurini/meteor-devtools-evolved/stargazers'
              target='_blank'
              rel='noopener noreferrer'
            >
              stargazers
            </a>
            .
          </p>

          <p>Let&apos;s make Meteor great again.</p>

          <h1>License</h1>

          <p>The MIT License (MIT)</p>

          <p>Copyright (c) 2020 Leonardo Venturini</p>

          <p>
            Permission is hereby granted, free of charge, to any person
            obtaining a copy of this software and associated documentation files
            (the "Software"), to deal in the Software without restriction,
            including without limitation the rights to use, copy, modify, merge,
            publish, distribute, sublicense, and/or sell copies of the Software,
            and to permit persons to whom the Software is furnished to do so,
            subject to the following conditions:
          </p>

          <p>
            The above copyright notice and this permission notice shall be
            included in all copies or substantial portions of the Software.
          </p>

          <p>
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
            NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
            BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
            ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
            CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </p>
        </div>
      </div>
    </Drawer>
  );
};
