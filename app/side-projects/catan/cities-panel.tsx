'use client'

import { useState } from 'react'
import type { Action, Game, Resource } from '@/lib/catan-rules'
import {
  bankAmount, canKnightMove, canRecruit, cityLabels, cityLimit, commodities, goodAmount,
  goods, goodsCount, goodsRate, metropolisAt, retreatOptions, trackCommodity, tracks,
} from '@/lib/catan-cities'
import type { Good } from '@/lib/catan-cities'
import { resourceLabels, resources } from '@/lib/catan-rules'
import { catanTranslator } from '@/lib/catan-i18n'
import type { CatanLanguage } from '@/lib/catan-i18n'
import styles from './table.module.css'

export function CitiesPanel({ game, actor, language, act }: { game: Game; actor: number; language: CatanLanguage; act: (action: Action) => void }) {
  const t = catanTranslator(language)
  const state = game.cities!
  const player = state.players[actor]
  const [amounts, setAmounts] = useState<Record<Good, number>>({ wood: 0, brick: 0, wool: 0, grain: 0, ore: 0, paper: 0, cloth: 0, coin: 0 })
  const [resource, setResource] = useState<Resource>('wood')
  const [give, setGive] = useState<Good>('wood')
  const [receive, setReceive] = useState<Good>('paper')
  const [giveCount, setGiveCount] = useState(1)
  const [receiveCount, setReceiveCount] = useState(1)
  const [target, setTarget] = useState(0)
  const [city, setCity] = useState(-1)
  const [recruit, setRecruit] = useState(-1)
  const [from, setFrom] = useState(-1)
  const [to, setTo] = useState(-1)
  const labelGood = (good: Good) => t(good === 'paper' || good === 'cloth' || good === 'coin' ? cityLabels[good] : resourceLabels[good])
  const cities = game.board.nodes.filter(node => node.owner === actor && node.city)
  const chosenCity = cities.some(node => node.id === city) ? city : cities[0]?.id ?? -1
  const recruits = game.board.nodes.filter(node => canRecruit(game, node.id)).map(node => node.id)
  const chosenRecruit = recruits.includes(recruit) ? recruit : recruits[0] ?? -1
  const ownKnights = state.knights.filter(knight => knight.owner === actor)
  const selectedKnight = ownKnights.some(knight => knight.node === from) ? from : ownKnights[0]?.node ?? -1
  const destinations = game.board.nodes.filter(node => canKnightMove(game, selectedKnight, node.id)).map(node => node.id)
  const selectedTo = destinations.includes(to) ? to : destinations[0] ?? -1
  const targetPlayer = target === actor ? (actor + 1) % game.players.length : target
  const nodeSelect = (label: string, value: number, nodes: number[], onChange: (node: number) => void) => <label className={styles.field}>{label}<select value={value} onChange={event => onChange(Number(event.target.value))}>
    {!nodes.length && <option value={-1}>{t('No legal target')}</option>}
    {nodes.map(node => <option key={node} value={node}>{t('Intersection {number}', { number: node + 1 })}</option>)}
  </select></label>
  const goodSelect = (label: string, value: Good, onChange: (value: Good) => void) => <label className={styles.field}>{label}<select value={value} onChange={event => onChange(event.target.value as Good)}>{goods.map(good => <option key={good} value={good}>{labelGood(good)}</option>)}</select></label>
  const resourcesSelect = <label className={styles.field}>{t('Chosen resource')}<select value={resource} onChange={event => setResource(event.target.value as Resource)}>{resources.map(item => <option key={item} value={item}>{t(resourceLabels[item])}</option>)}</select></label>
  const citySelector = nodeSelect(t('Selected city'), chosenCity, cities.map(node => node.id), setCity)
  const progressDescription = {
    supply: 'Take two of the chosen resource from the bank.',
    engineer: 'Add a free wall to the selected city.',
    fleet: 'Trade the chosen resource at 2:1 until your next turn.',
    monopoly: 'Take up to two of the chosen resource from each opponent.',
    mobilize: 'Activate all your inactive knights for free. They may act next turn.',
    bishop: 'Move the robber and steal once. Available after the first barbarian attack.',
  } as const
  return <section className={styles.citiesPanel} aria-label={t('Cities & Knights controls')}>
    <h3>{t('Commodities')}</h3>
    <div className={styles.actionRow}>{commodities.map(good => <span key={good}>{t(cityLabels[good])}: <b>{player.commodities[good]}</b></span>)}</div>
    <p className={styles.muted}>{t('{count} goods · safe limit {limit}', { count: goodsCount(game, actor), limit: cityLimit(game, actor) })}</p>

    {game.phase === 'discard' && <fieldset className={styles.handPicker}><legend>{t('Return half your goods')}</legend>
      {goods.map(good => <label key={good}><span>{labelGood(good)}</span><input aria-label={t('Discard {good}', { good: labelGood(good) })} type="number" min={0} max={goodAmount(game, actor, good)} value={amounts[good]} onChange={event => setAmounts(previous => ({ ...previous, [good]: Number(event.target.value) }))} /></label>)}
      <button className={styles.primary} onClick={() => act({ type: 'cityDiscard', amounts })}>{t('Return {count} cards', { count: Math.floor(goodsCount(game, actor) / 2) })}</button>
    </fieldset>}
    {game.phase === 'cityLoss' && <div className={styles.stack}>
      <p>{t('Choose a city to downgrade. Metropolises are protected. If all settlement pieces are used, the city is removed.')}</p>
      {cities.filter(node => !metropolisAt(game, node.id)).map(node => <button key={node.id} className={styles.secondary} onClick={() => act({ type: 'cityLoss', node: node.id })}>{t('Downgrade city {number}', { number: node.id + 1 })}</button>)}
    </div>}
    {game.phase === 'cityChoice' && <div className={styles.stack}><p>{t('Aqueduct: choose one available resource.')}</p>{resources.filter(item => bankAmount(game, item) > 0).map(item => <button className={styles.secondary} key={item} onClick={() => act({ type: 'cityChoice', resource: item })}>{t(resourceLabels[item])}</button>)}</div>}
    {game.phase === 'progressChoice' && <div className={styles.stack}><p>{t('Tied defenders: choose a progress deck.')}</p>{tracks.map(track => <button key={track} className={styles.secondary} onClick={() => act({ type: 'progressChoice', track })}>{t(cityLabels[track])}</button>)}</div>}
    {game.phase === 'progressDiscard' && <div className={styles.stack}><p>{t('Keep at most four progress cards. Return one now.')}</p>{player.progress.map((card, index) => <button key={index} className={styles.secondary} onClick={() => act({ type: 'progressDiscard', index })}>{t(cityLabels[card])}</button>)}</div>}
    {game.phase === 'retreat' && <div className={styles.stack}><p>{t('Your knight was displaced. Choose a retreat along your roads.')}</p>{retreatOptions(game).map(node => <button key={node} className={styles.secondary} onClick={() => act({ type: 'retreat', to: node })}>{t('Intersection {number}', { number: node + 1 })}</button>)}</div>}
    {game.phase === 'cityTrade' && state.trade && <div className={styles.stack}>
      <p>{t('You receive:')} {state.trade.giveCount} {labelGood(state.trade.give)}</p>
      <p>{t('You give:')} {state.trade.receiveCount} {labelGood(state.trade.receive)}</p>
      <button className={styles.primary} disabled={goodAmount(game, actor, state.trade.receive) < state.trade.receiveCount} onClick={() => act({ type: 'goodsAnswer', accept: true })}>{t('Accept')}</button>
      <button className={styles.secondary} onClick={() => act({ type: 'goodsAnswer', accept: false })}>{t('Decline')}</button>
    </div>}

    {game.phase === 'turn' && <>
      <details><summary>{t('City improvements & walls')}</summary><div className={styles.stack}>
        {citySelector}
        {tracks.map(track => <div key={track}><p>{t(cityLabels[track])}: {player.improvements[track]} / 5 · {t(cityLabels[trackCommodity[track]])}</p><button className={styles.secondary} disabled={!cities.length || player.improvements[track] >= 5 || player.commodities[trackCommodity[track]] < player.improvements[track] + 1} onClick={() => act({ type: 'improve', track, node: chosenCity })}>{t('Improve for {count} commodities', { count: player.improvements[track] + 1 })}</button></div>)}
        <button className={styles.secondary} disabled={chosenCity < 0 || state.walls.includes(chosenCity) || game.players[actor].hand.brick < 2} onClick={() => act({ type: 'wall', node: chosenCity })}>{t('Build wall · 2 brick')}</button>
      </div></details>
      <details><summary>{t('Knight pieces')}</summary><div className={styles.stack}>
        {nodeSelect(t('Recruit at'), chosenRecruit, recruits, setRecruit)}
        <button className={styles.secondary} disabled={chosenRecruit < 0 || game.players[actor].hand.ore < 1 || game.players[actor].hand.wool < 1} onClick={() => act({ type: 'recruit', node: chosenRecruit })}>{t('Recruit · 1 ore + 1 wool')}</button>
        {ownKnights.map(knight => <div key={knight.node} className={styles.devCard}>
          <strong>{t('Knight {number} · strength {strength}', { number: knight.node + 1, strength: knight.strength })}</strong><p>{t(knight.active ? 'Active' : 'Inactive')}</p>
          <button className={styles.secondary} disabled={knight.active || game.players[actor].hand.grain < 1} onClick={() => act({ type: 'activate', node: knight.node })}>{t('Activate · 1 grain')}</button>
          <button className={styles.secondary} disabled={knight.strength >= 3 || knight.promotedOn === game.turn || game.players[actor].hand.ore < 1 || game.players[actor].hand.wool < 1 || knight.strength === 2 && player.improvements.politics < 3} onClick={() => act({ type: 'promote', node: knight.node })}>{t('Promote · 1 ore + 1 wool')}</button>
          <button className={styles.secondary} disabled={!state.attacked || !knight.active || knight.readyOn > game.turn || !game.board.tiles[game.robber].nodes.includes(knight.node)} onClick={() => act({ type: 'driveRobber', node: knight.node })}>{t('Drive away robber')}</button>
        </div>)}
        {nodeSelect(t('Move knight from'), selectedKnight, ownKnights.map(knight => knight.node), setFrom)}
        {nodeSelect(t('Move knight to'), selectedTo, destinations, setTo)}
        <button className={styles.secondary} disabled={selectedTo < 0} onClick={() => act({ type: 'knightMove', from: selectedKnight, to: selectedTo })}>{t('Move or displace knight')}</button>
      </div></details>
      <details><summary>{t('Progress cards ({count})', { count: player.progress.length })}</summary><div className={styles.stack}>
        {resourcesSelect}{citySelector}
        {player.progress.map((card, index) => <div key={index} className={styles.devCard}><strong>{t(cityLabels[card])}</strong><p>{t(progressDescription[card])}</p><button className={styles.secondary} onClick={() => act({ type: 'progress', card, resource, node: chosenCity })}>{t('Play card')}</button></div>)}
        {!player.progress.length && <p>{t('Colored event dice award progress cards when your improvement level plus one reaches the red die.')}</p>}
      </div></details>
      <details><summary>{t('Trade resources & commodities')}</summary><div className={styles.stack}>
        {goodSelect(t('You give'), give, setGive)}{goodSelect(t('You receive'), receive, setReceive)}
        <button className={styles.secondary} disabled={give === receive || goodAmount(game, actor, give) < goodsRate(game, give) || bankAmount(game, receive) < 1} onClick={() => act({ type: 'goodsBank', give, receive })}>{t('Bank trade {rate}:1', { rate: goodsRate(game, give) })}</button>
        <label className={styles.field}>{t('Send offer to')}<select value={targetPlayer} onChange={event => setTarget(Number(event.target.value))}>{game.players.filter(other => other.id !== actor).map(other => <option key={other.id} value={other.id}>{other.name}</option>)}</select></label>
        <label className={styles.field}>{t('Amount you give')}<input type="number" min={1} value={giveCount} onChange={event => setGiveCount(Number(event.target.value))} /></label>
        <label className={styles.field}>{t('Amount you receive')}<input type="number" min={1} value={receiveCount} onChange={event => setReceiveCount(Number(event.target.value))} /></label>
        <button className={styles.primary} onClick={() => act({ type: 'goodsOffer', target: targetPlayer, give, receive, giveCount, receiveCount })}>{t('Propose trade')}</button>
      </div></details>
    </>}
  </section>
}
