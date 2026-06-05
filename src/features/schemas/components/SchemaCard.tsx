/* eslint-disable sort-imports */
'use client'

import { DataType, Ledgers, Network, PolygonNetworks } from '@/common/enums'
import {
  IAttributes,
  ISchemaCardProps,
  ISchemaData,
} from '../type/schemas-interface'
import React, { useState } from 'react'
import { Check, ChevronRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CustomCheckbox from '@/components/CustomCheckbox'
import DateTooltip from '@/components/DateTooltip'
import Loader from '@/components/Loader'
import { dateConversion } from '@/utils/DateConversion'
import { hardNavigate } from '@/utils/navigation'
import { limitedAttributesLength } from '@/config/CommonConstant'
import { pathRoutes } from '@/config/pathRoutes'
import { setSchemaDetails } from '@/lib/schemaStorageSlice'
import { useAppDispatch } from '@/lib/hooks'
import { usePathname } from 'next/navigation'

const SchemaCard = (props: Readonly<ISchemaCardProps>): React.JSX.Element => {
  const [isSelected, setIsSelected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const pathname = usePathname()
  const isVerificationPage = pathname.includes('verification')
  const dispatch = useAppDispatch()

  // Resolve a human-readable ledger label from the issuer DID
  let ledgerDisplay: string | undefined = undefined
  if (props.issuerDid?.includes(Ledgers.POLYGON)) {
    ledgerDisplay = props.issuerDid.includes(Network.TESTNET)
      ? PolygonNetworks.TESTNET
      : PolygonNetworks.MAINNET
  } else if (props?.issuerDid) {
    const [, , ledger] = props.issuerDid.split(':')
    ledgerDisplay = ledger
  }

  const handleButtonClick = (): void => {
    props.onClickW3cIssue?.(
      props.schemaId,
      props.schemaName,
      props.version,
      props.issuerDid,
      props.attributes,
      props.created,
    )
    dispatch(
      setSchemaDetails({
        type: 'W3C_SCHEMA',
        w3cSchema: {
          schemaVersion: props.version,
          value: JSON.stringify(props.attributes),
          label: `${props.schemaName}-${props.version}`,
          schemaId: props.schemaId,
          schemaName: props.schemaName,
          schemaIdentifier: props.schemaId,
          attributes: props.attributes,
          type: 'W3C_SCHEMA',
          credentialId: '',
        },
      }),
    )
    hardNavigate(pathRoutes.organizations.Issuance.issue)
  }

  const handleCheckboxChange = (
    checked: boolean,
    schemaData?: ISchemaData,
  ): void => {
    setIsSelected(checked)
    props.onChange?.(checked, schemaData ? [schemaData] : [])
  }

  const SchemaData = {
    schemaId: props.schemaId,
    attributes: props.attributes,
    issuerDid: props.issuerDid,
    created: props.created,
  }

  const W3CSchemaData = {
    schemaId: props.schemaId,
    schemaName: props.schemaName,
    version: props.version,
    issuerDid: props.issuerDid,
    attributes: props.attributes,
    created: props.created,
  }

  const hasNestedAttributes = props.attributes?.some(
    (attr: IAttributes) => attr.schemaDataType === DataType.ARRAY,
  )

  const handleCardClick = (): void => {
    // Verification pages with checkbox enabled — toggle selection on the card
    if (isVerificationPage && props.showCheckbox && !hasNestedAttributes) {
      const newSelected = !isSelected
      setIsSelected(newSelected)
      props.onChange?.(
        newSelected,
        newSelected
          ? [
              {
                schemaId: props.schemaId,
                schemaName: props.schemaName,
                attributes: props.attributes,
              },
            ]
          : [],
      )
      return
    }

    if (isVerificationPage) {
      return
    }

    if (!props.w3cSchema && !hasNestedAttributes && props.schemaId) {
      hardNavigate(`/schemas/${props.schemaId}?alias=${props.schemaName}`)
    }

    if (props.onClickCallback) {
      props.onClickCallback(SchemaData)
    }
    if (props.w3cSchema && props.onClickW3CCallback) {
      props.onClickW3CCallback(W3CSchemaData)
    }
  }

  // Selectable: verification page + checkbox enabled + no nested attrs
  const isSelectable =
    isVerificationPage && props.showCheckbox && !hasNestedAttributes

  // Navigable: INDY schemas on non-verification pages (clicking goes to detail)
  const isNavigable =
    !isVerificationPage &&
    !props.w3cSchema &&
    !hasNestedAttributes &&
    props.isClickable !== false

  // Either mode makes the card interactive (cursor + focus ring + hover lift)
  const isInteractive = isSelectable || isNavigable

  // Attribute pills — cap at limitedAttributesLength, show "+N more" for overflow
  const displayedAttributes: IAttributes[] = Array.isArray(props.attributes)
    ? props.attributes.slice(0, limitedAttributesLength)
    : []
  const extraCount = Array.isArray(props.attributes)
    ? Math.max(0, props.attributes.length - limitedAttributesLength)
    : 0

  // Whether to show the Issue button in the footer
  const showIssueButton =
    !isVerificationPage &&
    props.w3cSchema &&
    !props.isVerification &&
    !props.isVerificationUsingEmail

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={
        isInteractive
          ? (e: React.KeyboardEvent<HTMLDivElement>): void => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCardClick()
              }
            }
          : undefined
      }
      className={[
        'group relative flex flex-col rounded-[14px] border-[0.5px] p-5',
        'bg-card text-card-foreground',
        'transition-[transform,border-color,box-shadow] duration-200',
        isInteractive
          ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(87,29,247,0.6)] focus-visible:ring-offset-2'
          : 'cursor-default',
        isSelected && isSelectable
          ? 'border-[rgba(87,29,247,0.70)] shadow-[0_0_0_2px_rgba(87,29,247,0.20),0_8px_32px_rgba(87,29,247,0.18)]'
          : isInteractive
            ? 'border-[var(--border)] hover:-translate-y-[3px] hover:border-[rgba(87,29,247,0.40)] hover:shadow-[0_12px_30px_rgba(87,29,247,0.12)]'
            : 'border-[var(--border)] hover:border-[rgba(87,29,247,0.30)] hover:shadow-[0_4px_16px_rgba(87,29,247,0.07)]',
        hasNestedAttributes ? 'pointer-events-none opacity-80' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Radial gradient hover wash — gives the card a purple top-right glow on hover */}
      {!isSelected && isInteractive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse 55% 65% at 100% 0%, rgba(87,29,247,0.07) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Nested-attribute overlay — schema is API-only, not usable from the UI */}
      {hasNestedAttributes && (
        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-[14px]">
          <div className="bg-secondary text-secondary-foreground rounded-md p-4 text-center text-sm shadow-lg">
            This schema can only be used through the API as it contains nested
            objects.
          </div>
        </div>
      )}

      {/* ── Top row: type badge + date ── */}
      <div className="relative flex items-center justify-between gap-2">
        <span
          className={
            props.w3cSchema
              ? 'rounded-md border border-[rgba(87,29,247,0.20)] bg-[#F2ECFF] px-[7px] py-[2px] text-[10px] font-[700] tracking-[0.05em] text-[#571DF7] uppercase dark:bg-[rgba(87,29,247,0.20)] dark:text-[#9E6BFB]'
              : 'bg-secondary text-secondary-foreground rounded-md border px-[7px] py-[2px] text-[10px] font-[700] tracking-[0.05em] uppercase'
          }
        >
          {props.w3cSchema ? 'W3C' : 'INDY'}
        </span>
        <DateTooltip date={props.created}>
          <span className="text-muted-foreground text-[11px]">
            {dateConversion(props.created)}
          </span>
        </DateTooltip>
      </div>

      {/* ── Schema name + version ── */}
      <h3 className="text-foreground relative mt-3 font-serif text-[15px] leading-tight font-[700] tracking-[-0.01em]">
        {props.schemaName}
      </h3>
      <p className="text-muted-foreground relative mt-0.5 text-[11.5px]">
        Version: {props.version}
      </p>

      {/* ── Schema ID — clicking opens the side panel, not the card action ── */}
      <button
        type="button"
        className="url-link relative mt-3 flex w-full items-center gap-1.5 text-left"
        onClick={(e) => {
          e.stopPropagation()
          props.onTitleClick?.(e)
        }}
      >
        <strong className="text-foreground shrink-0 text-[12px] font-[600]">
          ID:
        </strong>
        <span className="text-muted-foreground min-w-0 truncate font-mono text-[11px]">
          {props.schemaId}
        </span>
      </button>

      {/* ── Issuer ── */}
      <p className="text-muted-foreground relative mt-1 text-[12px]">
        <strong className="text-foreground font-[600]">Issuer:</strong>{' '}
        {props.issuerName || ''}
      </p>

      {/* ── Ledger (only for DID methods that carry one) ── */}
      {!props.noLedger && ledgerDisplay && (
        <p className="text-muted-foreground relative mt-0.5 text-[12px]">
          <strong className="text-foreground font-[600]">Ledger:</strong>{' '}
          {ledgerDisplay}
        </p>
      )}

      {/* ── Attribute pills ── */}
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {displayedAttributes.map((attr: IAttributes) => (
          <span
            key={attr.attributeName}
            className="bg-secondary text-secondary-foreground rounded px-2 py-[2px] text-[11px] font-medium"
          >
            {attr.attributeName}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="text-muted-foreground ml-0.5 text-[11px]">
            +{extraCount} more
          </span>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="relative mt-4 flex items-center justify-between border-t border-[rgba(87,29,247,0.08)] pt-3">
        {/* Left label */}
        {isSelectable ? (
          <span
            className={`text-[11px] font-[600] transition-colors duration-200 ${
              isSelected
                ? 'text-[#571DF7]'
                : 'text-muted-foreground/50 group-hover:text-[#571DF7]'
            }`}
          >
            {isSelected ? 'Selected' : 'Click to select'}
          </span>
        ) : isNavigable ? (
          <span className="text-muted-foreground/50 text-[11px] font-[600] transition-colors duration-200 group-hover:text-[#571DF7]">
            View details
          </span>
        ) : (
          // W3C schemas — left side empty; Issue button is on the right
          <span />
        )}

        {/* Right action */}
        {isSelectable ? (
          isSelected ? (
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#571DF7]">
              <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
            </span>
          ) : (
            <span className="text-muted-foreground/50 text-[12.5px] font-[600] transition-colors duration-200 group-hover:text-[#571DF7]">
              Select →
            </span>
          )
        ) : isNavigable ? (
          <ChevronRight className="text-muted-foreground/50 h-4 w-4 transition-colors duration-200 group-hover:text-[#571DF7]" />
        ) : showIssueButton ? (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              setIsLoading(true)
              handleButtonClick()
            }}
            className="h-7 gap-1 text-[11px]"
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader size={14} />
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Issue
              </>
            )}
          </Button>
        ) : null}
      </div>

      {/* Legacy checkbox — kept for non-verification selection contexts where
          showCheckbox=true is passed (e.g. credential issuance schema pick). */}
      {props.showCheckbox && !hasNestedAttributes && !isVerificationPage && (
        <CustomCheckbox
          isSelectedSchema={Boolean(isSelected)}
          onChange={handleCheckboxChange}
          showCheckbox={props.showCheckbox}
          schemaData={{
            schemaId: props.schemaId,
            schemaName: props.schemaName,
            attributes: props.attributes,
          }}
        />
      )}
    </div>
  )
}

export default SchemaCard
