import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react'
import { isArray, isEmpty, isObject } from 'lodash'
import { shouldCollapseTreeNode } from './TreeExpansion'
import { useTreeExpansion } from './TreeExpansionContext'

interface Props {
  object: any
  level?: number
}

export const Collapsible: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
  object,
  level = 0,
}) => {
  const expansion = useTreeExpansion()
  const collapseFromPolicy = () =>
    shouldCollapseTreeNode({ ...expansion, level })
  const [isCollapsed, setIsCollapsed] = useState(collapseFromPolicy)

  useEffect(() => {
    setIsCollapsed(collapseFromPolicy())
  }, [expansion.defaultDepth, expansion.mode, level])

  if (isArray(object)) {
    const isArrayEmpty = isEmpty(object)

    if (isCollapsed || isArrayEmpty) {
      return (
        <span
          role='expand'
          onClick={() => !isArrayEmpty && setIsCollapsed(false)}
        >{`[${object.length}]`}</span>
      )
    }

    return (
      <>
        {level > 1 && (
          <span role='collapse' onClick={() => setIsCollapsed(true)}>
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
          role='expand'
          onClick={() => !isObjectEmpty && setIsCollapsed(false)}
        >{`{${Object.keys(object).length}}`}</span>
      )
    }

    return (
      <>
        {level > 1 && (
          <span role='collapse' onClick={() => setIsCollapsed(true)}>
            {'{-}'}
          </span>
        )}
        {children}
      </>
    )
  }

  console.error('Not a valid collapsible value.')

  console.trace(object)

  return null
}
