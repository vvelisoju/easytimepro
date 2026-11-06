# -*- coding: utf-8 -*-
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import stamp2datetime, datetime2stamp
import json


class BioTimeAppDateTime(object):
    """
    【DateTime Transform】
    """

    @ladonize(float, rtype=str)
    def stamp2datetime(self, stamp):
        """
        @param stamp: datetime stamp
        @rtype:
        """
        dt = stamp2datetime(stamp)
        return json.dumps(dt.strftime('%Y-%m-%d %H:%M:%S'))

    @ladonize(str, rtype=str)
    def datetime2stamp(self, dt):
        """
        @param dt:  2017-01-01 00:00:00/20170101000000
        @rtype:
        """
        stamp = datetime2stamp(dt)
        return json.dumps(stamp)
