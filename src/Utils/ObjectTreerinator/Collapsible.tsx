import React, { FunctionComponent, useState } from 'react'
import { isArray, isEmpty, isObject } from 'lodash'

interface Props {
 object: any
 level?: number
}

export const Collapsible: FunctionComponent<Props> = ({
 children,
 object,
 level = 0,
}) => {
 const [isCollapsed, setIsCollapsed] = useState(level > 5)

 if (isArray(object)) {
  const isArrayEmpty = isEmpty(object)

  if (isCollapsed || isArrayEmpty) {
   return (
    <span
     role="expand"
     onClick={() => !isArrayEmpty && setIsCollapsed(false)}
    >{`[${object.length}]`}</span>
   )
  }

  return (
   <>
    {level > 1 && (
     <span role="collapse" onClick={() => setIsCollapsed(true)}>
      {'[-]'}
     </span>
    )}
    {children}
   </>
  )
 }

 if (isObject(object)) {
  const isObjectEmpty = isEmpty(object)

  if (isCollapsed) {
   return (
    <span
     role="expand"
     onClick={() => !isObjectEmpty && setIsCollapsed(false)}
    >{`{${Object.keys(object).length}}`}</span>
   )
  }

  return (
   <>
    {level > 1 && (
     <span role="collapse" onClick={() => setIsCollapsed(true)}>
      {'{-}'}
     </span>
    )}
    {children}
   </>
  )
 }

 // eslint-disable-next-line no-console
 console.error('Not a valid collapsible value.')
 // eslint-disable-next-line no-console
 console.trace(object)

 return null
}
