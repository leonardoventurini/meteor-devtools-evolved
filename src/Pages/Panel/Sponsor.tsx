import { Classes, Drawer, Tag } from '@blueprintjs/core'
import React, { FunctionComponent } from 'react'
import { Separator } from '@/Components/Separator'
import MeteorCloudOffer from '@/Assets/meteor-cloud-offer.png'

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
      title='☁️ Deploy for Free'
      isOpen={isSponsorVisible}
      onClose={onClose}
    >
      <div className={Classes.DRAWER_BODY}>
        <div className={Classes.DIALOG_BODY}>
          <img
            src={MeteorCloudOffer}
            alt='Meteor Cloud Offer'
            style={{ width: '100%' }}
            className='mb-4'
          />
          <p>
            ✅ Do you have a Meteor app, but you’re looking for a better hosting
            platform?
          </p>

          <p>
            ✅ Do you want to scale your Meteor app confidently with minimal
            DevOps?
          </p>

          <p>
            ✅ Do you want to save time and money by effectively reducing DevOps
            expenses?
          </p>

          <p>
            If you answered yes to any of the questions above, we have the
            ultimate solution for you!
          </p>

          <p>
            Meteor Cloud provides a unique infrastructure designed for your
            Meteor app. Some of Meteor Cloud’s well-loved features include:
          </p>

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
            💡 Triggers (Autoscaling) allow you to adapt to usage fluctuations
          </div>

          <p>The best part? 👇</p>

          <p>
            As a Meteor DevTools Evolved user, you can use promo code{' '}
            <span className='orange'>DEVTOOLS60</span> to receive a $60 credit
            towards any paid plan!
          </p>

          <p>
            Sign up for a Meteor Cloud account{' '}
            <a
              href='https://social.meteor.com/devtools-evolved'
              target='_blank'
              rel='noreferrer'
            >
              here
            </a>
            , then email us at{' '}
            <a
              href='mailto:marketing@meteor.com'
              target='_blank'
              rel='noreferrer'
            >
              marketing@meteor.com
            </a>{' '}
            with your username and discount code.
          </p>
        </div>
      </div>
    </Drawer>
  )
}
