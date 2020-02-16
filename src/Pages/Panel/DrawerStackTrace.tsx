import React, { FunctionComponent } from 'react';
import { Classes, Drawer } from '@blueprintjs/core';
import { PanelStoreConstructor } from '../../Stores/PanelStore';
import { flow } from 'lodash/fp';
import { inject, observer } from 'mobx-react';

interface Props {
  panelStore?: PanelStoreConstructor;
}

export const DrawerStackTraceComponent: FunctionComponent<Props> = ({
  panelStore,
}) => (
  <Drawer
    icon='document'
    title='Stack Trace'
    isOpen={!!panelStore?.activeStackTrace}
    onClose={() => {
      panelStore?.setActiveStackTrace(null);
    }}
  >
    <div className={Classes.DRAWER_BODY}>
      <div className={Classes.DIALOG_BODY}>
        {panelStore?.activeStackTrace?.map(
          (stack: StackTrace, index: number) => {
            const text = (
              <div>
                <em>{stack?.functionName?.trim() ?? 'Anonymous'}</em>
                {'@'}
                <span>
                  {stack?.columnNumber && stack?.columnNumber}
                  {stack?.columnNumber && stack?.lineNumber ? ':' : null}
                  {stack?.lineNumber && stack?.lineNumber}
                </span>
              </div>
            );

            return (
              <pre key={index} style={{ marginBottom: 6 }}>
                {stack?.fileName ? (
                  <a
                    href={stack.fileName.trim()}
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
          },
        )}
      </div>
    </div>
  </Drawer>
);

export const DrawerStackTrace = flow(
  observer,
  inject('panelStore'),
)(DrawerStackTraceComponent);
