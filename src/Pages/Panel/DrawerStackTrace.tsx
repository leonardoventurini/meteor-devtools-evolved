import { Classes, Drawer } from '@blueprintjs/core';
import classnames from 'classnames';
import React, { FunctionComponent } from 'react';

interface Props {
  activeStackTrace: StackTrace[] | null;
  onClose(): void;
}

export const DrawerStackTrace: FunctionComponent<Props> = ({
  activeStackTrace,
  onClose,
}) => (
  <Drawer
    icon='document'
    title='Stack Trace'
    isOpen={!!activeStackTrace}
    onClose={onClose}
    size='72%'
  >
    <div className={Classes.DRAWER_BODY}>
      <div className={classnames(Classes.DIALOG_BODY, 'mde-stack-trace')}>
        {activeStackTrace?.map((stack: StackTrace, index: number) => {
          const text = (
            <div>
              <em>{stack?.callee?.trim() || 'Anonymous'}</em>
              {stack.column && stack.line && '@'}
              <span>
                {stack?.column && stack?.column}
                {stack?.column && stack?.line ? ':' : null}
                {stack?.line && stack?.line}
              </span>
            </div>
          );

          return (
            <pre key={index}>
              {stack?.file ? (
                <a
                  href={stack.file.trim()}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {text}
                </a>
              ) : (
                text
              )}
            </pre>
          );
        })}
      </div>
    </div>
  </Drawer>
);
