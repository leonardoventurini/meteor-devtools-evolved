import React from 'react'
import {
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import classnames from 'classnames'

export type GridItem = {
  name: string
  title: string
  role: string
  email?: string
  imageUrl?: string
  website?: string

  slack?: string

  linkedin?: string

  description?: string
}

export function PartnersGrid({ items, className = '' }) {
  return (
    <ul
      role='list'
      className={classnames(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map(person => (
        <li key={person.name} className='col-span-1'>
          <div className='divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white'>
            <div className='flex w-full items-center justify-between space-x-6 p-6'>
              <div className='flex-1 truncate'>
                <div className='flex items-center space-x-3'>
                  <h3 className='truncate text-sm font-medium text-gray-900'>
                    {person.name}
                  </h3>
                  <span className='inline-block flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'>
                    {person.role}
                  </span>
                </div>
                <p className='mt-1 truncate text-sm text-gray-500'>
                  {person.title}
                </p>
                {person.linkedin ? (
                  <a
                    href={person.linkedin}
                    className='text-sm font-medium text-gray-700 hover:text-gray-500'
                    target='_blank'
                    rel='noreferrer'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      className='inline-block h-5 w-5 fill-gray-500'
                    >
                      <path d='M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z' />
                    </svg>
                  </a>
                ) : null}
              </div>
              {person.imageUrl ? (
                <img
                  className='h-10 w-10 flex-shrink-0 rounded-full bg-white'
                  src={person.imageUrl}
                  alt=''
                />
              ) : null}
            </div>
            {person.description ? (
              <div className='p-3 text-base text-gray-700'>
                {person.description}
              </div>
            ) : null}
            <div>
              <div className='-mt-px flex divide-x divide-gray-200'>
                {person.email ? (
                  <div className='flex w-0 flex-1'>
                    <a
                      href={`mailto:${person.email}`}
                      className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center rounded-bl-lg border border-transparent py-4 text-sm font-medium text-gray-700 hover:text-gray-500'
                      target='_blank'
                      rel='noreferrer'
                    >
                      <EnvelopeIcon
                        className='h-5 w-5 text-gray-400'
                        aria-hidden='true'
                      />
                      <span className='ml-3'>Email</span>
                    </a>
                  </div>
                ) : null}
                {person.website ? (
                  <div className='flex w-0 flex-1'>
                    <a
                      href={person.website}
                      className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center rounded-bl-lg border border-transparent py-4 text-sm font-medium text-gray-700 hover:text-gray-500'
                      target='_blank'
                      rel='noreferrer'
                    >
                      <LinkIcon
                        className='h-5 w-5 text-gray-400'
                        aria-hidden='true'
                      />
                      <span className='ml-3'>Website</span>
                    </a>
                  </div>
                ) : null}

                {person.slack ? (
                  <div className='flex w-0 flex-1'>
                    <a
                      href={person.slack}
                      className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center rounded-bl-lg border border-transparent py-4 text-sm font-medium text-gray-700 hover:text-gray-500'
                      target='_blank'
                      rel='noreferrer'
                    >
                      <ChatBubbleLeftIcon
                        className='h-5 w-5 text-gray-400'
                        aria-hidden='true'
                      />
                      <span className='ml-3'>Community Slack</span>
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
