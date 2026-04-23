# Replace the three GET handlers with these scoped versions.
# POST / PATCH / DELETE stay superuser-only as before.

@router.get("/apiculteurs", response_model=list[ApiculteurOut])
async def list_apiculteurs(
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(get_current_user),
):
    # Non-superusers only see their own apiculteur
    if current["role"] != "superuser":
        apiculteur_id = current.get("apiculteur_id")
        if not apiculteur_id:
            return []
        a = (await session.execute(
            select(Apiculteur).where(Apiculteur.id == apiculteur_id)
        )).scalars().first()
        if not a:
            return []
        counts = await _hive_counts(session, a.id)
        return [ApiculteurOut(
            id=a.id, company_name=a.company_name, email=a.email,
            phone=a.phone, region=a.region, city=a.city,
            address=a.address, is_active=a.is_active, created_at=a.created_at,
            **counts,
        )]

    rows = (await session.execute(
        select(Apiculteur).order_by(Apiculteur.created_at.desc())
    )).scalars().all()
    out = []
    for a in rows:
        counts = await _hive_counts(session, a.id)
        out.append(ApiculteurOut(
            id=a.id, company_name=a.company_name, email=a.email,
            phone=a.phone, region=a.region, city=a.city,
            address=a.address, is_active=a.is_active, created_at=a.created_at,
            **counts,
        ))
    return out


@router.get("/apiculteurs/{apiculteur_id}", response_model=ApiculteurOut)
async def get_apiculteur(
    apiculteur_id: int,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(get_current_user),
):
    if current["role"] != "superuser" and current.get("apiculteur_id") != apiculteur_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    a = (await session.execute(
        select(Apiculteur).where(Apiculteur.id == apiculteur_id)
    )).scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Apiculteur introuvable")
    counts = await _hive_counts(session, a.id)
    return ApiculteurOut(
        id=a.id, company_name=a.company_name, email=a.email,
        phone=a.phone, region=a.region, city=a.city,
        address=a.address, is_active=a.is_active, created_at=a.created_at, **counts,
    )


@router.get("/apiculteurs/{apiculteur_id}/hives")
async def get_apiculteur_hives(
    apiculteur_id: int,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(get_current_user),
):
    if current["role"] != "superuser" and current.get("apiculteur_id") != apiculteur_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    rows = (await session.execute(
        select(Hive)
        .where(Hive.apiculteur_id == apiculteur_id)
        .where(Hive.deleted_at.is_(None))
        .order_by(Hive.created_at)
    )).scalars().all()
    return rows


@router.get("/apiculteurs/{apiculteur_id}/notifications")
async def get_apiculteur_notifications(
    apiculteur_id: int,
    session: AsyncSession = Depends(get_session),
    current: dict         = Depends(get_current_user),
):
    if current["role"] != "superuser" and current.get("apiculteur_id") != apiculteur_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    from app.api.routes_notifications import _build_notifications

    latest_ids_subq = (
        select(func.max(Measurement.id).label("max_id"))
        .join(Device, Device.id == Measurement.device_id)
        .join(Hive,   Hive.id   == Device.hive_id)
        .where(Hive.apiculteur_id == apiculteur_id)
        .where(Hive.deleted_at.is_(None))
        .group_by(Device.hive_id)
        .scalar_subquery()
    )

    rows = (await session.execute(
        select(Measurement, Hive, HiveThreshold)
        .join(Device,         Device.id         == Measurement.device_id)
        .join(Hive,           Hive.id           == Device.hive_id)
        .outerjoin(HiveThreshold, HiveThreshold.hive_id == Hive.id)
        .where(Measurement.id.in_(latest_ids_subq))
        .order_by(Measurement.ts.desc())
    )).all()

    from app.core.thresholds import get_thresholds_sync
    notifications = []
    for m, hive, threshold_row in rows:
        t = get_thresholds_sync(threshold_row)
        notifications.extend(_build_notifications(m, hive.name, hive.id, t))
    notifications.sort(key=lambda n: n.ts, reverse=True)
    return notifications