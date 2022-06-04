import React, { FC } from 'react'
import { StringUtils } from '@/Utils/StringUtils'
import { AppToaster } from '@/AppToaster'
import MeteorCloudLogo from '@/Assets/meteor-cloud-logo.png'

interface Props {}

export const SponsorHero: FC<Props> = () => {
  return (
    <div
      className='hero mb-4'
      style={{
        height: '30rem',
        backgroundImage: 'url(/build/assets/meteor-shower.png)',
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
            className='mb-4 select-none mx-auto'
          />

          <h1 className='mb-5 text-xl font-bold'>☁ Deploy for Free</h1>

          <p className='mb-5'>
            As a Meteor DevTools Evolved user, you can use the promo code{' '}
            <span
              className='text-orange-500 font-bold cursor-pointer'
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
            <span className='text-green-500 font-bold'>$60 credit</span> towards
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

          <div className='flex gap-2 justify-center'>
            <button
              className='btn btn-primary'
              onClick={() =>
                chrome.tabs.create({
                  url: 'https://social.meteor.com/devtools-evolved',
                })
              }
            >
              Sign Up
            </button>

            <button
              className='btn bg-orange-500 hover:bg-orange-600'
              onClick={() =>
                chrome.tabs.create({ url: 'mailto:marketing@meteor.com' })
              }
            >
              Email Us the Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
