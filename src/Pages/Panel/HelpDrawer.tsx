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
  },
]

const orgs: GridItem[] = [
  {
    name: 'Quave',
    title: 'Organization',
    role: 'Partner',
    website: 'https://www.quave.com.br/',
    email: 'contact@quave.com.br',
    imageUrl: QuaveLogo,
    description:
      'If you need help developing an app, maintaining an existing one or need to consult Meteor experts',
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
          <div className='mb-4 w-full text-lg'>
            <PartnersGrid items={people} className='mb-4' />
            <PartnersGrid items={orgs} />
          </div>
        </div>
      </div>
    </Drawer>
  )
}
