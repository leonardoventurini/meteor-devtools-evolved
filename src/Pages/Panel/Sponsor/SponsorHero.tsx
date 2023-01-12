import React, { FC } from 'react'
import { StringUtils } from '@/Utils/StringUtils'
import { AppToaster } from '@/AppToaster'
import MeteorCloudLogo from '@/Assets/meteor-cloud-logo.png'
import { openTab } from '@/Utils/BackgroundEvents'

import '@/Assets/meteor-shower.jpg'

interface Props {}

export const SponsorHero: FC<Props> = () => {
  return (
    <div
      className='hero mb-4'
      style={{
        height: '30rem',
        backgroundImage: 'url(/dist/assets/meteor-shower.jpg)',
      }}
      id='meteor-cloud-hero'
    >
      <div className='hero-overlay bg-opacity-70'></div>
      <div className='hero-content text-center text-neutral-content'>
        <div className='max-w-md'>
          <img
            src={MeteorCloudLogo}
            alt='Meteor Cloud Logo'
            style={{ width: '400px' }}
            className='mx-auto mb-4 select-none'
          />

          <h1 className='mb-5 text-xl font-bold'>☁ Deploy for Free</h1>

          <p className='mb-5'>
            As a Meteor DevTools Evolved user, you can use the promo code{' '}
            <span
              className='cursor-pointer font-bold text-orange-500'
              onClick={() => {
                StringUtils.toClipboard('DEVTOOLS60')
                AppToaster.show({
                  icon: 'tick',
                  message: 'Copied to Clipboard',
                  intent: 'success',
                  timeout: 1000,
                })
              }}
            >
              DEVTOOLS60
            </span>{' '}
            to receive a{' '}
            <span className='font-bold text-green-500'>$60 credit</span> towards
            any paid plan!
          </p>

          <p>
            Sign up for a Meteor Cloud account{' '}
            <a
              href='https://social.meteor.com/devtools-evolved'
              target='_blank'
              rel='noreferrer'
              className='link link-accent'
            >
              here
            </a>
            , then email us at{' '}
            <a
              href='mailto:marketing@meteor.com'
              target='_blank'
              rel='noreferrer'
              className='link link-accent'
            >
              marketing@meteor.com
            </a>{' '}
            with your username and discount code.
          </p>

          <div className='flex justify-center gap-2'>
            <button
              className='btn btn-primary'
              onClick={() =>
                openTab('https://social.meteor.com/devtools-evolved')
              }
            >
              Sign Up
            </button>

            <button
              className='btn bg-orange-500 hover:bg-orange-600'
              onClick={() => openTab('mailto:marketing@meteor.com')}
            >
              Email Us the Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
