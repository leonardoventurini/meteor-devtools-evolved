import { Classes, Drawer, Tag } from '@blueprintjs/core'
import React, { FunctionComponent } from 'react'

import '@/Assets/meteor-shower.png'
import { SponsorHero } from '@/Pages/Panel/Sponsor/SponsorHero'

interface Props {
  isSponsorVisible: boolean

  onClose(): void
}

export const Sponsor: FunctionComponent<Props> = ({
  isSponsorVisible,
  onClose,
}) => {
  return (
    <Drawer
      title={
        <div className='flex items-center gap-2'>
          <span>☁️ Deploy for Free</span>
          <Tag className='my-auto' minimal round>
            Sponsor
          </Tag>
        </div>
      }
      isOpen={isSponsorVisible}
      onClose={onClose}
    >
      <div className={Classes.DRAWER_BODY}>
        <SponsorHero />
        <div className={Classes.DIALOG_BODY}>
          <div className='w-full mb-4 text-lg'>
            <p>
              ✅ Do you have a Meteor app, but you’re looking for a better
              hosting platform?
            </p>

            <p>
              ✅ Do you want to scale your Meteor app confidently with minimal
              DevOps?
            </p>

            <p>
              ✅ Do you want to save time and money by effectively reducing
              DevOps expenses?
            </p>

            <p>
              If you answered yes to any of the questions above, we have the
              ultimate solution for you!
            </p>

            <p className='mb-4'>
              Meteor Cloud provides a unique infrastructure designed for your
              Meteor app. Some of Meteor Cloud’s well-loved features include:
            </p>

            <div>
              <div>💡 Free Automatic SSL</div>
              <div>💡 Push to Deploy</div>
              <div>💡 Outgoing IP Whitelist</div>
              <div>💡 One command deploy</div>
              <div>💡 Prerender SEO Optimization</div>
              <div>💡 Rollback feature to revert changes</div>
              <div>💡 Usage and warning notifications</div>
              <div>💡 Meteor APM for performance monitoring</div>
              <div>💡 Integration with a log system for issue monitoring</div>
              <div>💡 Zero downtime with coordinated version updates</div>
              <div>💡 Custom proxy layer tailored for Meteor applications</div>
              <div>
                💡 Triggers (Autoscaling) allow you to adapt to usage
                fluctuations
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
