import { Classes, Drawer, DrawerSize, Icon } from '@blueprintjs/core'
import React, { FunctionComponent } from 'react'
import { GridItem, PartnersGrid } from './PartnersGrid'
import AuthorLogo from '@/Assets/leonardoventurini.png'
import QuaveLogo from '@/Assets/quave-logo.png'
import MontiApmLogo from '@/Assets/monti-apm-logo.png'
import MeteorCloudLogo from '@/Assets/meteor-cloud-logo.png'

const people: GridItem[] = [
  {
    name: 'Leonardo Venturini',
    title: 'Senior Software Engineer',
    role: 'Author',
    email: 'leonardo@techster.tech',
    imageUrl: AuthorLogo,
    description:
      'If you need help with extension related issues or general Node.js or Meteor consulting',
    slack: 'https://meteor-community.slack.com/archives/DRKE6HDD5/',
    linkedin: 'https://www.linkedin.com/in/leonardo-venturini/',
    website: 'https://leonardoventurini.tech/',
  },
]

const orgs: GridItem[] = [
  {
    name: 'Quave',
    title: 'Organization',
    role: 'Partner',
    website: 'https://www.quave.dev/',
    email: 'contact@quave.dev',
    imageUrl: QuaveLogo,
    description:
      'If you need help developing an app, maintaining an existing one or need to consult Meteor experts',
    linkedin: 'https://www.linkedin.com/company/quave/',
  },
  {
    name: 'Monti APM',
    title: 'Organization',
    role: 'Partner',
    website: 'https://montiapm.com/',
    imageUrl: MontiApmLogo,
    description:
      'If you need a powerful application monitoring tool to complement your development stack',
  },
  {
    name: 'Meteor Cloud',
    title: 'Organization',
    role: 'Partner',
    website: 'https://social.meteor.com/devtools-evolved/',
    imageUrl: MeteorCloudLogo,
    description: 'If you need a complete hosting solution for your app',
  },
]

interface Props {
  isHelpDrawerVisible: boolean

  onClose(): void
}

const YEAR = new Date().getFullYear()

export const HelpDrawer: FunctionComponent<Props> = ({
  isHelpDrawerVisible,
  onClose,
}) => {
  return (
    <Drawer
      title={
        <div className='flex items-center gap-2'>
          <Icon icon='help' /> Help
        </div>
      }
      isOpen={isHelpDrawerVisible}
      onClose={onClose}
      size={DrawerSize.LARGE}
    >
      <div className={Classes.DRAWER_BODY}>
        <div className={Classes.DIALOG_BODY}>
          <div className='mb-4 w-full space-y-8 text-lg'>
            <div className='section'>
              <h2 className='section-title'>Extension</h2>
              <PartnersGrid items={people} />
            </div>

            <div className='section'>
              <h2 className='section-title'>Meteor & Development</h2>
              <PartnersGrid items={orgs} />
            </div>

            <div className='section'>
              <h2 className='section-title'>Basics</h2>
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
                The extension initializes with the page content, which means you
                have to refresh the page after installation, also it needs the
                devtools panel to be opened at least once in the current tab for
                any messages to be processed.
              </p>
              <p>
                Other than that you can just explore the extension at your
                leisure. It should be easy enough.
              </p>
            </div>

            <div className='section'>
              <h2 className='section-title'>Feedback</h2>
              <p>
                Any feedback you might have can be addressed directly at our{' '}
                <a
                  href='https://github.com/leonardoventurini/meteor-devtools-evolved/issues'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  GitHub Issues
                </a>{' '}
                page, that way we can discuss and transition into development
                more easily. You can also reach the author on the{' '}
                <a
                  href='https://meteor-community.slack.com/archives/DRKE6HDD5'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Meteor Community Slack
                </a>{' '}
                or the{' '}
                <a
                  href='https://forums.meteor.com/u/leonardoventurini'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Meteor Forums
                </a>
                .
              </p>
              <p>
                Starring the project is the easiest way to support the work and
                be part of our community of{' '}
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
            </div>

            <div className='section'>
              <h2 className='section-title'>Firefox</h2>
              <p>
                The Firefox port of the extension was a contribution made by{' '}
                <a
                  href='https://github.com/nilooy'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  RF Niloy
                </a>
                . Thank you!
              </p>
            </div>

            <div className='section'>
              <h2 className='section-title'>License</h2>
              <p>The MIT License (MIT)</p>
              <p>
                Copyright (c) {YEAR}{' '}
                <a
                  href='https://leonardoventurini.tech'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Leonardo Venturini
                </a>
              </p>
              <p>
                Permission is hereby granted, free of charge, to any person
                obtaining a copy of this software and associated documentation
                files (the "Software"), to deal in the Software without
                restriction, including without limitation the rights to use,
                copy, modify, merge, publish, distribute, sublicense, and/or
                sell copies of the Software, and to permit persons to whom the
                Software is furnished to do so, subject to the following
                conditions:
              </p>
              <p>
                The above copyright notice and this permission notice shall be
                included in all copies or substantial portions of the Software.
              </p>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
                NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
                WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
                FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
                OTHER DEALINGS IN THE SOFTWARE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
